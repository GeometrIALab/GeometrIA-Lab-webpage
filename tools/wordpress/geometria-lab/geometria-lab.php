<?php
/**
 * Plugin Name:       GeometrIA · CBG – Laboratório de IA e Geometria
 * Plugin URI:        https://github.com/TomasSilva/GeometrIA-Lab
 * Description:       Publica o site do GeometrIA em /GeometrIALab. O formulário de propostas só abre para quem entrou com a conta do site (página /acesso/).
 * Version:           1.1.9
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            GeometrIA · CBG
 * License:           MIT
 * Text Domain:       geometria-lab
 *
 * Como funciona
 *   O site (HTML, CSS, imagens) fica pronto na pasta site/ deste plugin, gerado pelo Jekyll com
 *   _config_cbg.yml (tools/wordpress/build-plugin.sh). As páginas são entregues por este
 *   arquivo no endereço /GeometrIALab/…; CSS, fontes e imagens são servidos direto da pasta do
 *   plugin, sem passar pelo PHP.
 *
 *   As páginas do formulário (colabore/ e en/collaborate/) exigem login. Sem login, a pessoa vai
 *   para /acesso/ e, depois de entrar, volta ao formulário. Com login, o plugin preenche nome e
 *   e-mail da conta e assina um "passe" com a chave compartilhada com o Google Apps Script
 *   (tools/form-backend.gs), que só aceita propostas com passe válido.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const GIA_VERSION   = '1.1.9';
const GIA_BASE      = '/GeometrIALab';                     // igual ao baseurl do _config_cbg.yml
const GIA_BUILD_URL = 'https://www.cbg.ime.unicamp.br';     // igual ao url do _config_cbg.yml
const GIA_LOGIN     = '/acesso/';                          // página de login e cadastro do site
const GIA_FROM_FORM = 'geometrialab';                      // ?geometrialab=1 em /acesso/: veio do formulário (aviso só nesse caso)
const GIA_GATED     = array( 'colabore/index.html', 'en/collaborate/index.html' );
const GIA_PASS_TTL  = 43200;                               // validade do passe: 12 h (o script aceita até 13 h)
const GIA_OPTION    = 'geometria_lab_key';                 // chave compartilhada com o script (WP_KEY)
const GIA_ENDPOINT  = 'geometria_lab_endpoint';            // URL /exec do script, se for outro que o do site gerado
const GIA_COOKIE    = 'geometria_lab_voltar';              // para onde voltar depois do login
const GIA_CACHE_VER = 'geometria_lab_cache_version';       // plugin enviado (versão e build) quando o cache foi limpo pela última vez

add_action( 'init', 'gia_route', 0 );
add_action( 'template_redirect', 'gia_return_after_login', 0 );
add_filter( 'login_redirect', 'gia_login_redirect', 99, 1 );
add_filter( 'forminator_submission_success', 'gia_forminator_login_redirect', 99, 1 );
add_action( 'admin_init', 'gia_return_from_admin', 0 );
add_action( 'wp_login', 'gia_mark_login', -9999, 0 );
add_filter( 'wp_redirect', 'gia_override_redirect', PHP_INT_MAX, 1 );
add_action( 'wp_footer', 'gia_login_notice' );
add_action( 'admin_menu', 'gia_admin_menu' );
add_action( 'admin_init', 'gia_register_setting' );
add_action( 'admin_notices', 'gia_admin_notice' );
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'gia_action_links' );
add_action( 'admin_init', 'gia_purge_cache_on_update', -1 );
add_action( 'admin_post_gia_purge_cache', 'gia_purge_cache_request' );
register_deactivation_hook( __FILE__, 'gia_deactivate' );

/* ---------------------------------------------------------------- endereços */

function gia_site_dir() {
	return __DIR__ . '/site';
}

/** Caminho do site no servidor, ex.: "/GeometrIALab" (ou "/wp/GeometrIALab" se o WordPress estiver numa subpasta). */
function gia_base_path() {
	$home = (string) wp_parse_url( home_url( '/' ), PHP_URL_PATH );
	return rtrim( $home, '/' ) . GIA_BASE;
}

function gia_starts_with( $haystack, $needle ) {
	return 0 === strncmp( $haystack, $needle, strlen( $needle ) );
}

/* ---------------------------------------------------------------- páginas */

/** Entrega /GeometrIALab/… antes do WordPress montar a página. */
function gia_route() {
	if ( is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) || empty( $_SERVER['REQUEST_URI'] ) ) {
		return;
	}
	$method = isset( $_SERVER['REQUEST_METHOD'] ) ? strtoupper( $_SERVER['REQUEST_METHOD'] ) : 'GET';
	$path   = rawurldecode( (string) wp_parse_url( wp_unslash( $_SERVER['REQUEST_URI'] ), PHP_URL_PATH ) );
	$base   = gia_base_path();
	$len    = strlen( $base );

	if ( 0 !== strncasecmp( $path, $base, $len ) ) {
		// Outra página do site: se a pessoa acabou de entrar vindo do formulário, volta para ele
		// antes que qualquer outro plugin a mande para outro lugar (ex.: a área do pesquisador).
		if ( 'GET' === $method && is_user_logged_in() && '' !== gia_return_path() ) {
			gia_return_after_login();
		}
		return;
	}
	$rest = (string) substr( $path, $len );
	if ( '' !== $rest && '/' !== $rest[0] ) {
		return;   // outro endereço que só começa igual, ex.: /GeometrIALabXYZ
	}
	// Endereço canônico do site: o mesmo host do WordPress (ex.: www.cbg.ime.unicamp.br). Sem isso, quem
	// chega por cbg.ime.unicamp.br/GeometrIALab recebe o cookie de volta nesse host, faz login em www…
	// e o cookie não vai junto, então a pessoa não volta ao formulário.
	$home_host = strtolower( (string) wp_parse_url( home_url( '/' ), PHP_URL_HOST ) );
	$req_host  = isset( $_SERVER['HTTP_HOST'] ) ? strtolower( preg_replace( '/:\d+$/', '', wp_unslash( $_SERVER['HTTP_HOST'] ) ) ) : $home_host;
	if ( '' !== $home_host && $req_host !== $home_host && ( 'GET' === $method || 'HEAD' === $method ) ) {
		$query = isset( $_SERVER['QUERY_STRING'] ) && '' !== $_SERVER['QUERY_STRING'] ? '?' . $_SERVER['QUERY_STRING'] : '';
		header( 'Location: ' . esc_url_raw( home_url( substr( $base . $rest, strlen( rtrim( (string) wp_parse_url( home_url( '/' ), PHP_URL_PATH ), '/' ) ) ) . $query ) ), true, 301 );
		exit;
	}
	if ( 'GET' !== $method && 'HEAD' !== $method ) {
		status_header( 405 );
		header( 'Allow: GET, HEAD' );
		exit;
	}
	// Endereço canônico: /GeometrIALab/ (com essa grafia e a barra final).
	if ( substr( $path, 0, $len ) !== $base || '' === $rest ) {
		$query = isset( $_SERVER['QUERY_STRING'] ) && '' !== $_SERVER['QUERY_STRING'] ? '?' . $_SERVER['QUERY_STRING'] : '';
		wp_safe_redirect( $base . ( '' === $rest ? '/' : $rest ) . $query, 301 );
		exit;
	}

	$rel = ltrim( $rest, '/' );
	if ( '' === $rel || '/' === substr( $rel, -1 ) ) {
		$rel .= 'index.html';
	}
	// Nada de "..", arquivos ocultos ou bytes nulos.
	if ( false !== strpos( $rel, "\0" ) || preg_match( '#(^|/)\.#', $rel ) ) {
		gia_send_404();
	}
	$dir  = realpath( gia_site_dir() );
	$file = realpath( gia_site_dir() . '/' . $rel );
	if ( $dir && $file && is_dir( $file ) && is_file( $file . '/index.html' ) ) {
		wp_safe_redirect( $base . '/' . $rel . '/', 301 );   // /GeometrIALab/pesquisa → /GeometrIALab/pesquisa/
		exit;
	}
	if ( ! $dir || ! $file || ! gia_starts_with( $file, $dir . DIRECTORY_SEPARATOR ) || ! is_file( $file ) ) {
		gia_send_404();
	}

	if ( in_array( $rel, GIA_GATED, true ) ) {
		gia_serve_gated( $file, $base . '/' . substr( $rel, 0, -strlen( 'index.html' ) ) );
	}
	gia_serve_file( $file, 200 );
}

function gia_send_404() {
	$page = gia_site_dir() . '/404.html';
	if ( is_file( $page ) ) {
		gia_serve_file( $page, 404 );
	}
	status_header( 404 );
	exit;
}

function gia_content_type( $file ) {
	$types = array(
		'html'  => 'text/html; charset=UTF-8',
		'css'   => 'text/css; charset=UTF-8',
		'js'    => 'text/javascript; charset=UTF-8',
		'json'  => 'application/json',
		'xml'   => 'application/xml; charset=UTF-8',
		'txt'   => 'text/plain; charset=UTF-8',
		'svg'   => 'image/svg+xml',
		'png'   => 'image/png',
		'jpg'   => 'image/jpeg',
		'jpeg'  => 'image/jpeg',
		'webp'  => 'image/webp',
		'ico'   => 'image/x-icon',
		'woff2' => 'font/woff2',
		'pdf'   => 'application/pdf',
		'zip'   => 'application/zip',
	);
	$ext = strtolower( pathinfo( $file, PATHINFO_EXTENSION ) );
	return isset( $types[ $ext ] ) ? $types[ $ext ] : 'application/octet-stream';
}

/** No HTML, CSS e imagens passam a vir direto da pasta do plugin (o servidor entrega sem PHP). */
function gia_rewrite_html( $html ) {
	$assets = plugins_url( 'site/assets/', __FILE__ );
	$home   = untrailingslashit( home_url( GIA_BASE ) );
	$html   = str_replace( GIA_BUILD_URL . GIA_BASE . '/assets/', $assets, $html );
	if ( GIA_BUILD_URL . GIA_BASE !== $home ) {
		$html = str_replace( GIA_BUILD_URL . GIA_BASE, $home, $html );   // outra instalação (ex.: um teste local)
	}
	$html = str_replace( '"' . GIA_BASE . '/assets/', '"' . $assets, $html );
	return $html;
}

function gia_serve_file( $file, $status ) {
	$type = gia_content_type( $file );
	$html = 0 === strpos( $type, 'text/html' );
	$body = $html ? gia_rewrite_html( (string) file_get_contents( $file ) ) : null;
	$etag = '"' . md5( GIA_VERSION . '|' . filemtime( $file ) . '|' . filesize( $file ) . '|' . ( $html ? md5( $body ) : '' ) ) . '"';

	status_header( $status );
	header( 'Content-Type: ' . $type );
	header( 'X-Content-Type-Options: nosniff' );
	header( 'Cache-Control: public, max-age=' . ( $html ? 300 : 3600 ) );
	header( 'ETag: ' . $etag );
	if ( 200 === $status && isset( $_SERVER['HTTP_IF_NONE_MATCH'] ) && trim( wp_unslash( $_SERVER['HTTP_IF_NONE_MATCH'] ) ) === $etag ) {
		status_header( 304 );
		exit;
	}
	header( 'Content-Length: ' . ( $html ? strlen( $body ) : filesize( $file ) ) );
	if ( 'HEAD' !== strtoupper( $_SERVER['REQUEST_METHOD'] ) ) {
		if ( $html ) {
			echo $body; // phpcs:ignore WordPress.Security.EscapeOutput -- páginas do próprio plugin
		} else {
			readfile( $file );
		}
	}
	exit;
}

/** Formulário: exige login; com login, preenche a conta e o passe assinado. */
function gia_serve_gated( $file, $page_path ) {
	if ( ! defined( 'DONOTCACHEPAGE' ) ) {
		define( 'DONOTCACHEPAGE', true );   // plugins de cache: não guardar esta página
	}
	nocache_headers();
	header( 'X-LiteSpeed-Cache-Control: no-cache' );

	if ( ! is_user_logged_in() ) {
		gia_set_cookie( $page_path, time() + 2 * HOUR_IN_SECONDS );
		// O ?geometrialab=1 marca quem veio do formulário. Endereço com parâmetro não entra no cache
		// do WP Fastest Cache, então o aviso nunca fica guardado na cópia de /acesso/ que todos recebem.
		wp_safe_redirect( add_query_arg( GIA_FROM_FORM, '1', home_url( GIA_LOGIN ) ), 302 );
		exit;
	}
	if ( ! empty( $_COOKIE[ GIA_COOKIE ] ) ) {
		gia_set_cookie( '', time() - YEAR_IN_SECONDS );
	}

	$user  = wp_get_current_user();
	$email = strtolower( trim( (string) $user->user_email ) );
	$name  = trim( $user->first_name . ' ' . $user->last_name );
	if ( '' === $name ) {
		$name = (string) $user->display_name;
	}
	$key  = (string) get_option( GIA_OPTION, '' );
	$pass = '';
	if ( '' !== $key && '' !== $email ) {
		$exp  = time() + GIA_PASS_TTL;
		$pass = $exp . '.' . hash_hmac( 'sha256', 'wp|' . $email . '|' . $exp, $key );
	}
	$html     = gia_rewrite_html( (string) file_get_contents( $file ) );
	$endpoint = (string) get_option( GIA_ENDPOINT, '' );
	if ( '' !== $endpoint ) {   // script trocado pelo painel, sem gerar o plugin de novo
		$html = preg_replace( '/data-endpoint="[^"]*"/', 'data-endpoint="' . esc_attr( $endpoint ) . '"', $html, 1 );
	}
	$html = strtr(
		$html,
		array(
			'%%GIA_EMAIL%%'  => esc_attr( $email ),
			'%%GIA_NAME%%'   => esc_attr( $name ),
			'%%GIA_PASS%%'   => esc_attr( $pass ),
			'%%GIA_LOGOUT%%' => esc_url( wp_logout_url( home_url( GIA_BASE . '/' ) ) ),
		)
	);
	status_header( 200 );
	header( 'Content-Type: text/html; charset=UTF-8' );
	header( 'X-Content-Type-Options: nosniff' );
	header( 'Content-Length: ' . strlen( $html ) );
	if ( 'HEAD' !== strtoupper( $_SERVER['REQUEST_METHOD'] ) ) {
		echo $html; // phpcs:ignore WordPress.Security.EscapeOutput -- valores já escapados acima
	}
	exit;
}

/* ---------------------------------------------------------------- volta depois do login */

function gia_set_cookie( $value, $expires ) {
	$opts = array(
		'expires'  => $expires,
		'path'     => COOKIEPATH ? COOKIEPATH : '/',
		'secure'   => is_ssl(),
		'httponly' => true,
		'samesite' => 'Lax',
	);
	if ( COOKIE_DOMAIN ) {
		$opts['domain'] = COOKIE_DOMAIN;
	}
	setcookie( GIA_COOKIE, $value, $opts );
	if ( '' === $value ) {
		unset( $_COOKIE[ GIA_COOKIE ] );
	}
}

/** Endereço guardado no cookie, se for uma página do GeometrIA. */
function gia_return_path() {
	if ( empty( $_COOKIE[ GIA_COOKIE ] ) ) {
		return '';
	}
	$path = wp_unslash( $_COOKIE[ GIA_COOKIE ] );
	$base = gia_base_path();
	if ( ! is_string( $path ) || ! gia_starts_with( $path, $base . '/' ) || preg_match( '#[^A-Za-z0-9/_\-.]#', $path ) || false !== strpos( $path, '..' ) ) {
		return '';
	}
	return $path;
}

/** Depois de entrar em /acesso/, a pessoa cai numa página do WordPress: manda de volta ao formulário. */
function gia_return_after_login() {
	if ( ! is_user_logged_in() ) {
		return;
	}
	$path = gia_return_path();
	if ( '' === $path ) {
		return;
	}
	gia_set_cookie( '', time() - YEAR_IN_SECONDS );
	header( 'X-GeometrIA: volta-ao-formulario' );
	wp_safe_redirect( $path, 302 );
	exit;
}

/**
 * Login pelo formulário do Forminator (o da página /acesso/ do CBG): o login é feito por AJAX e o
 * próprio Forminator decide para onde ir depois (mensagem na mesma página ou redirecionamento
 * configurado no formulário). Se a pessoa veio do formulário do GeometrIA, manda de volta para ele.
 */
function gia_forminator_login_redirect( $response ) {
	if ( ! is_array( $response ) || empty( $response['success'] ) ) {
		return $response;
	}
	$type = isset( $_POST['form_type'] ) ? sanitize_key( wp_unslash( $_POST['form_type'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification -- só lê o tipo; o Forminator já conferiu o envio
	$path = gia_return_path();
	if ( 'login' !== $type || '' === $path ) {
		return $response;
	}
	$home = wp_parse_url( home_url( '/' ) );
	$url  = $home['scheme'] . '://' . $home['host'] . ( isset( $home['port'] ) ? ':' . $home['port'] : '' ) . $path;
	$response['url']      = $url;
	$response['newtab']   = 'sametab';
	$response['redirect'] = true;
	$response['behav']    = 'behaviour-redirect';
	return $response;
}

/** Marca que o login aconteceu nesta requisição (o usuário atual só muda na próxima). */
function gia_mark_login() {
	$GLOBALS['gia_logged_in_now'] = true;
}

/**
 * Qualquer redirecionamento feito pelo servidor logo depois do login (por outro plugin, pelo tema
 * ou por um snippet) é trocado pelo formulário, enquanto a pessoa estiver voltando para ele.
 * No painel do WordPress (fora do AJAX), nada muda.
 */
function gia_override_redirect( $location ) {
	if ( ! is_string( $location ) || '' === $location ) {
		return $location;
	}
	$path = gia_return_path();
	if ( '' === $path || ( is_admin() && ! wp_doing_ajax() ) ) {
		return $location;
	}
	if ( empty( $GLOBALS['gia_logged_in_now'] ) && ! is_user_logged_in() ) {
		return $location;
	}
	$target = (string) wp_parse_url( $location, PHP_URL_PATH );
	if ( 0 === strpos( $target, gia_base_path() . '/' ) || false !== strpos( $location, 'action=logout' ) || false !== strpos( $location, 'loggedout' ) ) {
		return $location;
	}
	header( 'X-GeometrIA: volta-ao-formulario' );
	return $path;
}

/** Se o login levar a pessoa ao painel (/wp-admin/), também volta ao formulário. */
function gia_return_from_admin() {
	if ( wp_doing_ajax() || ( isset( $_SERVER['REQUEST_METHOD'] ) && 'GET' !== $_SERVER['REQUEST_METHOD'] ) ) {
		return;
	}
	gia_return_after_login();
}

/** Login pelo formulário padrão do WordPress: volta direto ao formulário. */
function gia_login_redirect( $redirect_to ) {
	$path = gia_return_path();
	return '' === $path ? $redirect_to : $path;
}

/** Em /acesso/, explica por que a pessoa foi parar ali. */
function gia_login_notice() {
	if ( is_user_logged_in() || '' === gia_return_path() || ! isset( $_GET[ GIA_FROM_FORM ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return;
	}
	$here = (string) wp_parse_url( wp_unslash( isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : '' ), PHP_URL_PATH );
	if ( untrailingslashit( $here ) !== untrailingslashit( (string) wp_parse_url( home_url( GIA_LOGIN ), PHP_URL_PATH ) ) ) {
		return;
	}
	$en  = false !== strpos( gia_return_path(), '/en/' );
	$msg = $en
		? 'To send your proposal to GeometrIA, log in with your CBG website account or sign up below. After logging in, you will go straight back to the form.'
		: 'Para enviar sua proposta ao GeometrIA, entre com a sua conta do site do CBG ou cadastre-se abaixo. Depois de entrar, você volta direto ao formulário.';
	$close = $en ? 'Close' : 'Fechar';
	// Esta página tem um aviso só para esta pessoa: nenhum cache deve guardá-la.
	if ( ! defined( 'DONOTCACHEPAGE' ) ) {
		define( 'DONOTCACHEPAGE', true );
	}
	if ( function_exists( 'wpfc_exclude_current_page' ) ) {
		wpfc_exclude_current_page();
	}
	echo '<div id="gia-login-notice" role="status" style="position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:99999;max-width:min(640px,calc(100% - 32px));box-sizing:border-box;padding:14px 44px 14px 18px;border-radius:12px;background:#0E2A47;color:#fff;font:15px/1.5 system-ui,sans-serif;box-shadow:0 8px 28px rgba(14,42,71,.28)">'
		. esc_html( $msg )
		. '<button type="button" aria-label="' . esc_attr( $close ) . '" onclick="this.parentNode.remove()" style="position:absolute;top:8px;right:10px;border:0;background:none;color:#fff;font-size:22px;line-height:1;cursor:pointer">&times;</button></div>';
}

/* ---------------------------------------------------------------- cache das páginas */

/*
 * O WP Fastest Cache guarda cópias das páginas do laboratório (em <wp-content>/cache/all/GeometrIALab/),
 * e o Apache entrega essas cópias antes de o WordPress rodar. Ele também troca o main.css por uma cópia
 * "minificada" (em <wp-content>/cache/wpfc-minified/…/), cujo nome ignora o ?v= do endereço: sem
 * limpeza, o CSS antigo continuaria valendo para sempre. Por isso, a cada plugin enviado (versão e
 * build), as cópias das páginas e do CSS e JS do laboratório são apagadas uma vez, na primeira página
 * do painel, e o cache volta a se formar com a versão nova. No CBG, o menu do WP Fastest Cache fica
 * escondido dos administradores; também dá para limpar à mão em Configurações → GeometrIA.
 */

/** Identifica o plugin enviado: versão do código e momento do build do site (arquivo site/.build). */
function gia_build_id() {
	$build = gia_site_dir() . '/.build';
	return GIA_VERSION . '|' . ( is_file( $build ) ? md5( (string) file_get_contents( $build ) ) : '' );
}

function gia_purge_cache_on_update() {
	$id = gia_build_id();
	if ( get_option( GIA_CACHE_VER ) === $id ) {
		return;
	}
	gia_purge_page_cache();
	update_option( GIA_CACHE_VER, $id, false );
}

/**
 * Apaga as cópias das páginas do laboratório guardadas pelo WP Fastest Cache e as cópias minificadas
 * do CSS e do JS do laboratório. Devolve quantos arquivos saíram.
 */
function gia_purge_page_cache() {
	$root = WP_CONTENT_DIR . '/cache';
	$n    = gia_purge_minified( $root . '/wpfc-minified', $root );   // antes das páginas, que apontam para elas
	foreach ( array( 'all', 'wpfc-mobile-cache' ) as $type ) {
		$n += gia_rm_tree( $root . '/' . $type . gia_base_path(), $root );
	}
	// Até a versão 1.1.6, a cópia de /acesso/ guardada pelo cache podia levar o aviso do laboratório,
	// que então aparecia para todo mundo. Apaga essa cópia só se ela tiver o aviso.
	$login = trailingslashit( (string) wp_parse_url( home_url( GIA_LOGIN ), PHP_URL_PATH ) );
	foreach ( array( 'all', 'wpfc-mobile-cache' ) as $type ) {
		$copy = $root . '/' . $type . $login . 'index.html';
		if ( is_file( $copy ) && false !== strpos( (string) file_get_contents( $copy ), 'gia-login-notice' ) && @unlink( $copy ) ) {
			$n++;
		}
	}
	// Variantes que o próprio WP Fastest Cache conhece (idiomas, domínios): página por página, pelo gancho dele.
	if ( has_action( 'wpfc_clear_cache_by_url' ) && is_dir( gia_site_dir() ) ) {
		$site = gia_site_dir();
		$it   = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $site, FilesystemIterator::SKIP_DOTS ) );
		foreach ( $it as $f ) {
			if ( 'index.html' === $f->getFilename() ) {
				$rel = trim( str_replace( '\\', '/', substr( $f->getPath(), strlen( $site ) ) ), '/' );
				do_action( 'wpfc_clear_cache_by_url', home_url( GIA_BASE . '/' . ( '' === $rel ? '' : $rel . '/' ) ) );
			}
		}
	}
	return $n;
}

/**
 * Cada pasta de wpfc-minified guarda a cópia de um CSS ou JS. Apaga só as que vieram dos arquivos do
 * laboratório, reconhecidas por trechos que só existem neles (as do resto do site ficam).
 */
function gia_purge_minified( $dir, $inside ) {
	$marks = array(
		array( 'brand-word', 'cbg-cobrand' ),            // assets/css/main.css
		array( 'data-menu-toggle', 'data-theme-toggle' ), // assets/js/main.js
		array( '[GeometrIA]', 'data-pdf-input' ),         // assets/js/form.js
	);
	$n    = 0;
	$subs = is_dir( $dir ) ? glob( $dir . '/*', GLOB_ONLYDIR ) : false;
	foreach ( $subs ? $subs : array() as $sub ) {
		$files = glob( $sub . '/*' );
		foreach ( $files ? $files : array() as $file ) {
			if ( ! preg_match( '/\.(css|js)$/i', $file ) || ! is_file( $file ) || filesize( $file ) > 4 * 1024 * 1024 ) {
				continue;
			}
			$text = (string) file_get_contents( $file );
			foreach ( $marks as $m ) {
				if ( false !== strpos( $text, $m[0] ) && false !== strpos( $text, $m[1] ) ) {
					$n += gia_rm_tree( $sub, $inside );
					continue 3;
				}
			}
		}
	}
	return $n;
}

/** Apaga uma pasta inteira, só se ela estiver dentro de $inside (sem seguir atalhos). Devolve quantos arquivos saíram. */
function gia_rm_tree( $dir, $inside ) {
	$real = realpath( $dir );
	$root = realpath( $inside );
	if ( ! $real || ! $root || ! is_dir( $real ) || 0 !== strpos( $real, $root . DIRECTORY_SEPARATOR ) ) {
		return 0;
	}
	$n  = 0;
	$it = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $real, FilesystemIterator::SKIP_DOTS ), RecursiveIteratorIterator::CHILD_FIRST );
	foreach ( $it as $f ) {
		if ( $f->isDir() && ! $f->isLink() ) {
			@rmdir( $f->getPathname() );
		} elseif ( @unlink( $f->getPathname() ) ) {
			$n++;
		}
	}
	@rmdir( $real );
	return $n;
}

/** Botão "Limpar o cache das páginas" em Configurações → GeometrIA. */
function gia_purge_cache_request() {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Sem permissão.', '', array( 'response' => 403 ) );
	}
	check_admin_referer( 'gia_purge_cache' );
	$n = gia_purge_page_cache();
	wp_safe_redirect( add_query_arg( array( 'page' => 'geometria-lab', 'gia_cache' => $n ), admin_url( 'options-general.php' ) ) );
	exit;
}

/** Ao desativar, as cópias saem do cache (senão o Apache continuaria entregando as páginas). */
function gia_deactivate() {
	gia_purge_page_cache();
	delete_option( GIA_CACHE_VER );
}

/* ---------------------------------------------------------------- configurações */

function gia_admin_menu() {
	add_options_page( 'GeometrIA', 'GeometrIA', 'manage_options', 'geometria-lab', 'gia_settings_page' );
}

function gia_register_setting() {
	register_setting(
		'geometria_lab',
		GIA_OPTION,
		array(
			'type'              => 'string',
			'sanitize_callback' => 'gia_sanitize_key',
			'default'           => '',
			'show_in_rest'      => false,
		)
	);
	register_setting(
		'geometria_lab',
		GIA_ENDPOINT,
		array(
			'type'              => 'string',
			'sanitize_callback' => 'gia_sanitize_endpoint',
			'default'           => '',
			'show_in_rest'      => false,
		)
	);
}

/** Aceita só URLs de implantação do Apps Script (conta comum ou Google Workspace). Em branco: o do site gerado. */
function gia_sanitize_endpoint( $value ) {
	$value = trim( (string) $value );
	if ( '' === $value || preg_match( '#^https://script\.google\.com/(a/macros/[A-Za-z0-9.-]+|macros)/s/[A-Za-z0-9_-]+/exec$#', $value ) ) {
		return $value;
	}
	add_settings_error( GIA_ENDPOINT, 'gia_endpoint', 'O endereço do script deve ser o URL da implantação, que começa com https://script.google.com/ e termina em /exec.' );
	return (string) get_option( GIA_ENDPOINT, '' );
}

function gia_sanitize_key( $value ) {
	$value = strtolower( trim( (string) $value ) );
	if ( '' === $value ) {
		return (string) get_option( GIA_OPTION, '' );   // campo em branco: mantém a chave atual
	}
	if ( ! preg_match( '/^[0-9a-f]{64}$/', $value ) ) {
		add_settings_error( GIA_OPTION, 'gia_key', 'A chave deve ter 64 caracteres (0–9 e a–f), exatamente como aparece no registro do script.' );
		return (string) get_option( GIA_OPTION, '' );
	}
	return $value;
}

function gia_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$key   = (string) get_option( GIA_OPTION, '' );
	$build = is_file( gia_site_dir() . '/.build' ) ? trim( (string) file_get_contents( gia_site_dir() . '/.build' ) ) : '';
	$url   = home_url( GIA_BASE . '/' );
	?>
	<div class="wrap">
		<h1>GeometrIA</h1>
		<p>O site do laboratório está em <a href="<?php echo esc_url( $url ); ?>"><?php echo esc_html( $url ); ?></a>. O formulário de propostas só abre para quem entrou com a conta do site, pela página <a href="<?php echo esc_url( home_url( GIA_LOGIN ) ); ?>"><?php echo esc_html( GIA_LOGIN ); ?></a>.</p>
		<?php if ( $build ) : ?>
			<p>Versão do site neste plugin, <code><?php echo esc_html( $build ); ?></code>.</p>
		<?php endif; ?>
		<form method="post" action="options.php">
			<?php settings_fields( 'geometria_lab' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="gia-key">Chave do formulário</label></th>
					<td>
						<input type="password" id="gia-key" name="<?php echo esc_attr( GIA_OPTION ); ?>" value="" class="regular-text code" autocomplete="off" placeholder="<?php echo $key ? esc_attr( 'configurada, termina em ' . substr( $key, -4 ) ) : ''; ?>">
						<p class="description">No Google Apps Script do formulário, execute a função <code>setup</code> (ou <code>mostrarChaveWordPress</code>) e copie a chave que aparece no registro de execução. Ela é a mesma dos dois lados e fica guardada só aqui e no script. Deixe em branco para manter a chave atual.</p>
						<p><?php echo $key ? '<strong style="color:#1a7f37">Chave configurada.</strong>' : '<strong style="color:#b32d2e">Falta a chave. Sem ela, nenhuma proposta é aceita.</strong>'; ?></p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="gia-endpoint">Endereço do script</label></th>
					<td>
						<input type="url" id="gia-endpoint" name="<?php echo esc_attr( GIA_ENDPOINT ); ?>" value="<?php echo esc_attr( (string) get_option( GIA_ENDPOINT, '' ) ); ?>" class="large-text code" placeholder="https://script.google.com/macros/s/…/exec">
						<p class="description">URL da implantação do Google Apps Script (termina em <code>/exec</code>). Deixe em branco para usar o que veio no site gerado (<code>_data/form.yml</code>). Ao trocar de script, troque também a chave acima.</p>
					</td>
				</tr>
			</table>
			<?php submit_button( 'Salvar' ); ?>
		</form>
		<h2>Cache das páginas</h2>
		<?php if ( isset( $_GET['gia_cache'] ) ) : // phpcs:ignore WordPress.Security.NonceVerification.Recommended ?>
			<div class="notice notice-success inline"><p>Cache das páginas do laboratório limpo (<?php echo (int) $_GET['gia_cache']; // phpcs:ignore WordPress.Security.NonceVerification.Recommended ?> arquivos apagados). Recarregue o site com Cmd+Shift+R (ou Ctrl+Shift+R).</p></div>
		<?php endif; ?>
		<p>O WP Fastest Cache guarda cópias das páginas e do CSS do laboratório. Elas são apagadas sozinhas a cada plugin enviado. Use o botão se alguma página continuar mostrando a versão antiga.</p>
		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
			<input type="hidden" name="action" value="gia_purge_cache">
			<?php wp_nonce_field( 'gia_purge_cache' ); ?>
			<?php submit_button( 'Limpar o cache das páginas do laboratório', 'secondary', 'gia-purge', false ); ?>
		</form>
	</div>
	<?php
}

function gia_admin_notice() {
	if ( ! current_user_can( 'manage_options' ) || '' !== (string) get_option( GIA_OPTION, '' ) ) {
		return;
	}
	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	if ( $screen && 'settings_page_geometria-lab' === $screen->id ) {
		return;
	}
	echo '<div class="notice notice-warning"><p>GeometrIA, falta configurar a chave do formulário em <a href="' . esc_url( admin_url( 'options-general.php?page=geometria-lab' ) ) . '">Configurações → GeometrIA</a>. Sem ela, as propostas não são aceitas.</p></div>';
}

function gia_action_links( $links ) {
	array_unshift( $links, '<a href="' . esc_url( admin_url( 'options-general.php?page=geometria-lab' ) ) . '">Configurações</a>' );
	return $links;
}
