<?php
/**
 * Publicação automática do site do GeometrIA.
 *
 * A cada push no repositório (GIA_REPO), o GitHub gera o site e publica um pacote numa release
 * (.github/workflows/publicar-cbg.yml). Este arquivo baixa esse pacote, confere e troca a pasta do
 * site, sem reinstalar o plugin:
 *   • o GitHub avisa o WordPress em /wp-json/geometria-lab/v1/publicar, com uma assinatura feita com a
 *     "chave de publicação" (o segredo CBG_DEPLOY_SECRET no GitHub);
 *   • de hora em hora o WordPress também confere a release mais recente, caso o aviso não chegue;
 *   • em Configurações → GeometrIA há "Atualizar agora", "Voltar para a versão anterior" e o registro.
 * O pacote só pode ter arquivos estáticos (HTML, CSS, JS, imagens, fontes): nenhum código PHP é baixado.
 * As versões ficam em <uploads>/geometria-lab/site-…/ (a atual e a anterior).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const GIA_REPO       = 'GeometrIALab/GeometrIA-Lab-webpage';
const GIA_PKG_FILE   = 'geometria-lab-site.zip';
const GIA_PKG_INFO   = 'build.json';
const GIA_PUB_OPTION = 'geometria_lab_site';            // versão no ar: pasta, tag, commit, data e a anterior
const GIA_PUB_SECRET = 'geometria_lab_deploy_secret';   // chave de publicação (segredo CBG_DEPLOY_SECRET no GitHub)
const GIA_PUB_PAUSE  = 'geometria_lab_deploy_paused';   // '1' pausa as atualizações automáticas
const GIA_PUB_LOG    = 'geometria_lab_deploy_log';      // últimas tentativas
const GIA_PUB_CRON   = 'gia_pub_check';
const GIA_PUB_MAX_MB = 40;
const GIA_PUB_EXTS   = array( 'html', 'css', 'js', 'json', 'txt', 'svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'ico', 'woff', 'woff2', 'pdf' );

add_action( 'rest_api_init', 'gia_pub_rest' );
add_action( 'init', 'gia_pub_schedule' );
add_action( GIA_PUB_CRON, 'gia_pub_cron' );
add_action( 'admin_post_gia_pub_update', 'gia_pub_update_request' );
add_action( 'admin_post_gia_pub_rollback', 'gia_pub_rollback_request' );
add_action( 'admin_post_gia_pub_secret', 'gia_pub_secret_request' );
add_action( 'admin_post_gia_pub_pause', 'gia_pub_pause_request' );
add_action( 'admin_post_gia_pub_test', 'gia_pub_test_request' );

/* ---------------------------------------------------------------- onde ficam as versões */

/** Pasta e endereço de <uploads>/geometria-lab. */
function gia_pub_root( $url = false ) {
	$up = wp_upload_dir( null, false );
	return $url ? set_url_scheme( $up['baseurl'] . '/geometria-lab' ) : $up['basedir'] . '/geometria-lab';
}

/** Versão baixada que está no ar (com path e url), ou null se o site ainda é o que veio no plugin. */
function gia_pub_current() {
	$cur = get_option( GIA_PUB_OPTION );
	if ( ! is_array( $cur ) || empty( $cur['dir'] ) || ! preg_match( '/^site-[A-Za-z0-9._-]+$/', $cur['dir'] ) ) {
		return null;
	}
	$path = gia_pub_root() . '/' . $cur['dir'];
	if ( ! is_file( $path . '/index.html' ) ) {
		return null;
	}
	$cur['path'] = $path;
	$cur['url']  = gia_pub_root( true ) . '/' . $cur['dir'] . '/';
	return $cur;
}

/** Endereço de um arquivo da release (a mais recente, se $tag estiver vazio). Os testes trocam a origem pelo filtro. */
function gia_pub_release_url( $tag, $file ) {
	$base = apply_filters( 'gia_pub_download_base', 'https://github.com/' . GIA_REPO . '/releases' );
	return '' === $tag ? $base . '/latest/download/' . $file : $base . '/download/' . rawurlencode( $tag ) . '/' . $file;
}

/* ---------------------------------------------------------------- instalar uma versão */

/** Lê o build.json da release mais recente: { tag, sha256, commit, time }. */
function gia_pub_latest_info() {
	$res = wp_safe_remote_get( gia_pub_release_url( '', GIA_PKG_INFO ), array( 'timeout' => 20, 'redirection' => 5 ) );
	if ( is_wp_error( $res ) ) {
		return new WP_Error( 'gia_pub', 'Não foi possível consultar o GitHub (' . $res->get_error_message() . ').' );
	}
	$code = (int) wp_remote_retrieve_response_code( $res );
	if ( 200 !== $code ) {
		return new WP_Error( 'gia_pub', 404 === $code ? 'O repositório ainda não tem nenhuma versão publicada.' : 'O GitHub respondeu com o código ' . $code . '.' );
	}
	$info = json_decode( (string) wp_remote_retrieve_body( $res ), true );
	if ( ! is_array( $info ) || empty( $info['tag'] ) ) {
		return new WP_Error( 'gia_pub', 'O arquivo build.json da release está ilegível.' );
	}
	return $info;
}

/**
 * Baixa, confere e põe no ar a versão descrita em $info ({ tag, sha256, commit }).
 * Devolve array( ok, message, tag ) e registra a tentativa.
 */
function gia_pub_install( $info, $via ) {
	$tag    = isset( $info['tag'] ) ? (string) $info['tag'] : '';
	$sha    = isset( $info['sha256'] ) ? strtolower( (string) $info['sha256'] ) : '';
	$commit = isset( $info['commit'] ) ? (string) $info['commit'] : '';
	if ( ! preg_match( '/^site-[A-Za-z0-9._-]{1,80}$/', $tag ) || ! preg_match( '/^[0-9a-f]{64}$/', $sha ) || ! preg_match( '/^[0-9a-f]{0,40}$/i', $commit ) ) {
		return gia_pub_result( false, 'Versão inválida.', $tag, $via );
	}
	$cur = gia_pub_current();
	if ( $cur && $cur['tag'] === $tag ) {
		return gia_pub_result( true, 'Esta versão já está no ar.', $tag, $via, false );
	}
	if ( get_transient( 'gia_pub_lock' ) ) {
		return gia_pub_result( false, 'Outra atualização está em andamento. Tente de novo em alguns minutos.', $tag, $via );
	}
	set_transient( 'gia_pub_lock', 1, 5 * MINUTE_IN_SECONDS );

	require_once ABSPATH . 'wp-admin/includes/file.php';
	$root = gia_pub_root();
	$tmpd = '';
	$zipf = download_url( gia_pub_release_url( $tag, GIA_PKG_FILE ), 120 );
	try {
		if ( is_wp_error( $zipf ) ) {
			throw new Exception( 'Não foi possível baixar o pacote (' . $zipf->get_error_message() . ').' );
		}
		if ( filesize( $zipf ) > GIA_PUB_MAX_MB * MB_IN_BYTES ) {
			throw new Exception( 'O pacote passa de ' . GIA_PUB_MAX_MB . ' MB.' );
		}
		if ( ! hash_equals( $sha, hash_file( 'sha256', $zipf ) ) ) {
			throw new Exception( 'O pacote baixado não confere com o publicado (SHA-256 diferente).' );
		}
		if ( ! wp_mkdir_p( $root ) ) {
			throw new Exception( 'Não foi possível criar a pasta ' . $root . '.' );
		}
		gia_pub_protect( $root );
		$tmpd = $root . '/.tmp-' . wp_generate_password( 10, false, false );
		if ( ! wp_mkdir_p( $tmpd ) ) {
			throw new Exception( 'Não foi possível criar uma pasta temporária em ' . $root . '.' );
		}
		gia_pub_extract( $zipf, $tmpd );
		foreach ( array( 'index.html', '404.html', 'assets/css/main.css' ) as $must ) {
			if ( ! is_file( $tmpd . '/' . $must ) ) {
				throw new Exception( 'O pacote está incompleto (falta ' . $must . ').' );
			}
		}
		$dir = $tag;
		if ( file_exists( $root . '/' . $dir ) ) {
			$dir .= '-' . strtolower( wp_generate_password( 6, false, false ) );
		}
		if ( ! @rename( $tmpd, $root . '/' . $dir ) ) {
			throw new Exception( 'Não foi possível pôr a versão nova no lugar.' );
		}
		$tmpd = '';
	} catch ( Exception $e ) {
		if ( $tmpd ) {
			gia_rm_tree( $tmpd, $root );
		}
		if ( is_string( $zipf ) ) {
			@unlink( $zipf );
		}
		delete_transient( 'gia_pub_lock' );
		return gia_pub_result( false, $e->getMessage(), $tag, $via );
	}
	@unlink( $zipf );

	$new = array(
		'dir'       => $dir,
		'tag'       => $tag,
		'commit'    => $commit,
		'installed' => time(),
		'via'       => $via,
		'prev'      => $cur ? array( 'dir' => $cur['dir'], 'tag' => $cur['tag'], 'commit' => isset( $cur['commit'] ) ? $cur['commit'] : '' ) : null,
	);
	update_option( GIA_PUB_OPTION, $new, true );
	gia_pub_cleanup();
	gia_purge_page_cache();
	update_option( GIA_CACHE_VER, gia_build_id(), false );
	delete_transient( 'gia_pub_lock' );
	return gia_pub_result( true, 'Versão nova no ar.', $tag, $via );
}

/**
 * Extrai o pacote em $dest, recusando tudo o que não for arquivo estático: caminhos com "..", arquivos
 * ocultos (exceto o carimbo .build), extensões fora da lista e pacotes grandes demais.
 */
function gia_pub_extract( $zipfile, $dest ) {
	if ( ! class_exists( 'ZipArchive' ) ) {
		throw new Exception( 'O PHP do servidor não tem a extensão Zip.' );
	}
	$zip = new ZipArchive();
	if ( true !== $zip->open( $zipfile ) ) {
		throw new Exception( 'O pacote não é um arquivo zip válido.' );
	}
	$total = 0;
	$list  = array();
	for ( $i = 0; $i < $zip->numFiles; $i++ ) {
		$st   = $zip->statIndex( $i );
		$name = (string) $st['name'];
		if ( '' === $name || '/' === substr( $name, -1 ) ) {
			continue;   // pasta
		}
		$ext = strtolower( pathinfo( $name, PATHINFO_EXTENSION ) );
		$bad = strlen( $name ) > 200 || false !== strpos( $name, "\0" ) || false !== strpos( $name, '\\' ) || '/' === $name[0]
			|| preg_match( '#(^|/)\.\.?(/|$)#', $name ) || ! preg_match( '#^[A-Za-z0-9._/-]+$#', $name )
			|| ( '.build' !== $name && ( preg_match( '#(^|/)\.#', $name ) || ! in_array( $ext, GIA_PUB_EXTS, true ) ) );
		if ( $bad ) {
			$zip->close();
			throw new Exception( 'O pacote tem um arquivo não permitido (' . sanitize_text_field( $name ) . ').' );
		}
		$total += (int) $st['size'];
		$list[] = array( $i, $name );
	}
	if ( count( $list ) > 5000 || $total > GIA_PUB_MAX_MB * MB_IN_BYTES ) {
		$zip->close();
		throw new Exception( 'O pacote é grande demais.' );
	}
	foreach ( $list as $item ) {
		$target = $dest . '/' . $item[1];
		$data   = $zip->getFromIndex( $item[0] );
		if ( false === $data || ! wp_mkdir_p( dirname( $target ) ) || false === file_put_contents( $target, $data ) ) {
			$zip->close();
			throw new Exception( 'Não foi possível gravar ' . $item[1] . '.' );
		}
	}
	$zip->close();
	return count( $list );
}

/** As páginas passam pelo plugin (que exige login no formulário): o servidor só entrega CSS, fontes e imagens. */
function gia_pub_protect( $root ) {
	$ht = $root . '/.htaccess';
	if ( ! is_file( $ht ) ) {
		file_put_contents( $ht, "Options -Indexes\n<FilesMatch \"\\.(html|xml|txt|json|build)$\">\n  <IfModule mod_authz_core.c>\n    Require all denied\n  </IfModule>\n  <IfModule !mod_authz_core.c>\n    Order allow,deny\n    Deny from all\n  </IfModule>\n</FilesMatch>\n" );
	}
	if ( ! is_file( $root . '/index.php' ) ) {
		file_put_contents( $root . '/index.php', "<?php\n// Silence is golden.\n" );
	}
}

/** Mantém só a versão atual e a anterior (e apaga pastas temporárias esquecidas). */
function gia_pub_cleanup() {
	$cur  = get_option( GIA_PUB_OPTION );
	$keep = array();
	if ( is_array( $cur ) ) {
		$keep[] = $cur['dir'];
		if ( ! empty( $cur['prev']['dir'] ) ) {
			$keep[] = $cur['prev']['dir'];
		}
	}
	$root = gia_pub_root();
	$dirs = array_merge( (array) glob( $root . '/site-*', GLOB_ONLYDIR ), (array) glob( $root . '/.tmp-*', GLOB_ONLYDIR ) );
	foreach ( $dirs as $d ) {
		if ( $d && ! in_array( basename( $d ), $keep, true ) && ( 0 === strpos( basename( $d ), 'site-' ) || filemtime( $d ) < time() - HOUR_IN_SECONDS ) ) {
			gia_rm_tree( $d, $root );
		}
	}
}

/** Volta para a versão anterior e pausa as atualizações automáticas (senão a próxima verificação desfaria a volta). */
function gia_pub_rollback() {
	$cur = get_option( GIA_PUB_OPTION );
	if ( ! is_array( $cur ) || empty( $cur['prev']['dir'] ) || ! is_file( gia_pub_root() . '/' . $cur['prev']['dir'] . '/index.html' ) ) {
		return gia_pub_result( false, 'Não há versão anterior guardada.', '', 'manual' );
	}
	$new = array(
		'dir'       => $cur['prev']['dir'],
		'tag'       => $cur['prev']['tag'],
		'commit'    => $cur['prev']['commit'],
		'installed' => time(),
		'via'       => 'volta',
		'prev'      => array( 'dir' => $cur['dir'], 'tag' => $cur['tag'], 'commit' => $cur['commit'] ),
	);
	update_option( GIA_PUB_OPTION, $new, true );
	update_option( GIA_PUB_PAUSE, '1', false );
	gia_purge_page_cache();
	update_option( GIA_CACHE_VER, gia_build_id(), false );
	return gia_pub_result( true, 'Versão anterior no ar. As atualizações automáticas foram pausadas.', $new['tag'], 'manual' );
}

/** Registra a tentativa (as 15 últimas) e devolve o resultado. */
function gia_pub_result( $ok, $message, $tag, $via, $log = true ) {
	if ( $log ) {
		$entries = get_option( GIA_PUB_LOG );
		$entries = is_array( $entries ) ? $entries : array();
		array_unshift( $entries, array( 'time' => time(), 'ok' => (bool) $ok, 'tag' => $tag, 'via' => $via, 'msg' => $message ) );
		update_option( GIA_PUB_LOG, array_slice( $entries, 0, 15 ), false );
	}
	return array( 'ok' => (bool) $ok, 'message' => $message, 'tag' => $tag );
}

/* ---------------------------------------------------------------- aviso do GitHub e verificação periódica */

function gia_pub_rest() {
	register_rest_route(
		'geometria-lab/v1',
		'/publicar',
		array(
			'methods'             => 'POST',
			'callback'            => 'gia_pub_webhook',
			'permission_callback' => '__return_true',   // a assinatura é conferida dentro
		)
	);
}

/** POST do GitHub: corpo = build.json, cabeçalho X-GeometrIA-Signature = "sha256=" + HMAC-SHA256(chave, corpo). */
function gia_pub_webhook( WP_REST_Request $req ) {
	$secret = (string) get_option( GIA_PUB_SECRET, '' );
	$body   = (string) $req->get_body();
	if ( '' === $secret ) {
		return new WP_REST_Response( array( 'ok' => false, 'message' => 'A chave de publicação não está configurada no WordPress.' ), 403 );
	}
	if ( strlen( $body ) > 2000 || ! hash_equals( 'sha256=' . hash_hmac( 'sha256', $body, $secret ), (string) $req->get_header( 'X-GeometrIA-Signature' ) ) ) {
		return new WP_REST_Response( array( 'ok' => false, 'message' => 'Assinatura inválida.' ), 401 );
	}
	$info = json_decode( $body, true );
	if ( ! is_array( $info ) || ! isset( $info['time'] ) || abs( time() - (int) $info['time'] ) > 30 * MINUTE_IN_SECONDS ) {
		return new WP_REST_Response( array( 'ok' => false, 'message' => 'Aviso antigo ou malformado.' ), 400 );
	}
	if ( '1' === get_option( GIA_PUB_PAUSE ) ) {
		$r = gia_pub_result( false, 'Atualizações automáticas pausadas em Configurações → GeometrIA.', (string) $info['tag'], 'github' );
		return new WP_REST_Response( $r, 409 );
	}
	$r = gia_pub_install( $info, 'github' );
	return new WP_REST_Response( $r, $r['ok'] ? 200 : 500 );
}

function gia_pub_schedule() {
	if ( ! wp_next_scheduled( GIA_PUB_CRON ) ) {
		wp_schedule_event( time() + 10 * MINUTE_IN_SECONDS, 'hourly', GIA_PUB_CRON );
	}
}

/** De hora em hora: se houver uma versão mais nova no GitHub, põe no ar. */
function gia_pub_cron() {
	if ( '1' === get_option( GIA_PUB_PAUSE ) ) {
		return;
	}
	$info = gia_pub_latest_info();
	if ( is_wp_error( $info ) ) {
		return;   // GitHub fora do ar ou sem releases: tenta de novo na próxima hora
	}
	$cur = gia_pub_current();
	if ( ! $cur || $cur['tag'] !== $info['tag'] ) {
		gia_pub_install( $info, 'verificação automática' );
	}
}

function gia_pub_unschedule() {
	wp_clear_scheduled_hook( GIA_PUB_CRON );
}

/* ---------------------------------------------------------------- botões em Configurações → GeometrIA */

function gia_pub_check_admin( $action ) {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Sem permissão.', '', array( 'response' => 403 ) );
	}
	check_admin_referer( $action );
}

function gia_pub_back( $result ) {
	set_transient( 'gia_pub_msg_' . get_current_user_id(), $result, 5 * MINUTE_IN_SECONDS );
	wp_safe_redirect( admin_url( 'options-general.php?page=geometria-lab#publicacao' ) );
	exit;
}

function gia_pub_update_request() {
	gia_pub_check_admin( 'gia_pub_update' );
	$info = gia_pub_latest_info();
	gia_pub_back( is_wp_error( $info ) ? gia_pub_result( false, $info->get_error_message(), '', 'manual' ) : gia_pub_install( $info, 'manual' ) );
}

function gia_pub_rollback_request() {
	gia_pub_check_admin( 'gia_pub_rollback' );
	gia_pub_back( gia_pub_rollback() );
}

function gia_pub_secret_request() {
	gia_pub_check_admin( 'gia_pub_secret' );
	update_option( GIA_PUB_SECRET, bin2hex( random_bytes( 32 ) ), false );
	gia_pub_back( array( 'ok' => true, 'message' => 'Chave nova gerada. Copie e cole no GitHub como o segredo CBG_DEPLOY_SECRET (a anterior deixou de valer).' ) );
}

function gia_pub_pause_request() {
	gia_pub_check_admin( 'gia_pub_pause' );
	$paused = '1' === get_option( GIA_PUB_PAUSE );
	update_option( GIA_PUB_PAUSE, $paused ? '0' : '1', false );
	gia_pub_back( array( 'ok' => true, 'message' => $paused ? 'Atualizações automáticas reativadas.' : 'Atualizações automáticas pausadas.' ) );
}

function gia_pub_test_request() {
	gia_pub_check_admin( 'gia_pub_test' );
	$info = gia_pub_latest_info();
	if ( is_wp_error( $info ) ) {
		gia_pub_back( array( 'ok' => false, 'message' => $info->get_error_message() ) );
	}
	$cur = gia_pub_current();
	$msg = 'O WordPress consegue consultar o GitHub. A versão mais recente publicada é ' . $info['tag'] . ( $cur && $cur['tag'] === $info['tag'] ? ', que já está no ar.' : ', que ainda não está no ar (use "Atualizar agora").' );
	gia_pub_back( array( 'ok' => true, 'message' => $msg ) );
}

/** Seção "Publicação automática" da página de configurações. */
function gia_pub_settings_section() {
	$cur    = gia_pub_current();
	$secret = (string) get_option( GIA_PUB_SECRET, '' );
	$paused = '1' === get_option( GIA_PUB_PAUSE );
	$log    = get_option( GIA_PUB_LOG );
	$msg    = get_transient( 'gia_pub_msg_' . get_current_user_id() );
	$repo   = 'https://github.com/' . GIA_REPO;
	$fmt    = function ( $t ) {
		return wp_date( 'd/m/Y H:i', (int) $t );
	};
	$form   = function ( $action, $label, $type = 'secondary' ) {
		echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" style="display:inline-block;margin:0 8px 8px 0">';
		echo '<input type="hidden" name="action" value="' . esc_attr( $action ) . '">';
		wp_nonce_field( $action );
		submit_button( $label, $type, '', false, array( 'id' => str_replace( '_', '-', $action ) ) );
		echo '</form>';
	};
	if ( $msg ) {
		delete_transient( 'gia_pub_msg_' . get_current_user_id() );
	}
	?>
	<h2 id="publicacao">Publicação automática</h2>
	<?php if ( $msg ) : ?>
		<div class="notice <?php echo $msg['ok'] ? 'notice-success' : 'notice-error'; ?> inline"><p><?php echo esc_html( $msg['message'] ); ?></p></div>
	<?php endif; ?>
	<p>A cada push no repositório <a href="<?php echo esc_url( $repo ); ?>"><?php echo esc_html( GIA_REPO ); ?></a>, o GitHub gera o site e avisa este WordPress, que baixa a versão nova e a põe no ar em um ou dois minutos. Se o aviso não chegar, o WordPress confere sozinho a versão mais recente de hora em hora.</p>
	<table class="form-table" role="presentation">
		<tr>
			<th scope="row">Versão no ar</th>
			<td>
				<?php if ( $cur ) : ?>
					<code><?php echo esc_html( $cur['tag'] ); ?></code>
					<?php if ( ! empty( $cur['commit'] ) ) : ?>, commit <a href="<?php echo esc_url( $repo . '/commit/' . $cur['commit'] ); ?>"><code><?php echo esc_html( substr( $cur['commit'], 0, 7 ) ); ?></code></a><?php endif; ?>,
					posta no ar em <?php echo esc_html( $fmt( $cur['installed'] ) ); ?>.
				<?php else : ?>
					A cópia que veio no plugin. Nenhuma versão foi baixada do GitHub ainda.
				<?php endif; ?>
				<?php if ( $paused ) : ?>
					<p><strong style="color:#b32d2e">As atualizações automáticas estão pausadas.</strong></p>
				<?php endif; ?>
				<p style="margin-top:10px">
					<?php
					$form( 'gia_pub_update', 'Atualizar agora', 'primary' );
					if ( $cur && ! empty( $cur['prev']['tag'] ) ) {
						$form( 'gia_pub_rollback', 'Voltar para a versão anterior (' . $cur['prev']['tag'] . ')' );
					}
					$form( 'gia_pub_pause', $paused ? 'Reativar as atualizações automáticas' : 'Pausar as atualizações automáticas' );
					$form( 'gia_pub_test', 'Testar a conexão com o GitHub' );
					?>
				</p>
			</td>
		</tr>
		<tr>
			<th scope="row"><label for="gia-pub-secret">Chave de publicação</label></th>
			<td>
				<?php if ( $secret ) : ?>
					<input type="text" id="gia-pub-secret" value="<?php echo esc_attr( $secret ); ?>" class="large-text code" readonly onclick="this.select()">
				<?php else : ?>
					<p><strong style="color:#b32d2e">Ainda não há chave.</strong> Sem ela, o WordPress recusa o aviso do GitHub e só atualiza na verificação de hora em hora.</p>
				<?php endif; ?>
				<p class="description">No GitHub, em Settings → Secrets and variables → Actions → New repository secret, crie o segredo <code>CBG_DEPLOY_SECRET</code> com esta chave. O aviso chega em <code><?php echo esc_html( rest_url( 'geometria-lab/v1/publicar' ) ); ?></code>.</p>
				<p><?php $form( 'gia_pub_secret', $secret ? 'Gerar outra chave' : 'Gerar chave' ); ?></p>
			</td>
		</tr>
	</table>
	<?php if ( is_array( $log ) && $log ) : ?>
		<h3>Últimas tentativas</h3>
		<table class="widefat striped" style="max-width:960px">
			<thead><tr><th>Data</th><th>Versão</th><th>Origem</th><th>Resultado</th></tr></thead>
			<tbody>
			<?php foreach ( $log as $e ) : ?>
				<tr>
					<td><?php echo esc_html( $fmt( $e['time'] ) ); ?></td>
					<td><code><?php echo esc_html( $e['tag'] ); ?></code></td>
					<td><?php echo esc_html( $e['via'] ); ?></td>
					<td><?php echo $e['ok'] ? '' : '<strong style="color:#b32d2e">Falhou.</strong> '; ?><?php echo esc_html( $e['msg'] ); ?></td>
				</tr>
			<?php endforeach; ?>
			</tbody>
		</table>
	<?php endif; ?>
	<?php
}
