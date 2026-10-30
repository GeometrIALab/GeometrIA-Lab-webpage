<?php
// Remoção do plugin pelo painel: apaga a chave do formulário guardada no banco.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}
delete_option( 'geometria_lab_key' );
delete_option( 'geometria_lab_endpoint' );
delete_option( 'geometria_lab_cache_version' );
delete_option( 'geometria_lab_site' );
delete_option( 'geometria_lab_deploy_secret' );
delete_option( 'geometria_lab_deploy_paused' );
delete_option( 'geometria_lab_deploy_log' );
wp_clear_scheduled_hook( 'gia_pub_check' );

// Versões do site baixadas do GitHub (<uploads>/geometria-lab).
$gia_up   = wp_upload_dir( null, false );
$gia_root = realpath( $gia_up['basedir'] . '/geometria-lab' );
if ( $gia_root && is_dir( $gia_root ) && 'geometria-lab' === basename( $gia_root ) ) {
	$gia_it = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $gia_root, FilesystemIterator::SKIP_DOTS ), RecursiveIteratorIterator::CHILD_FIRST );
	foreach ( $gia_it as $gia_f ) {
		if ( $gia_f->isDir() && ! $gia_f->isLink() ) {
			@rmdir( $gia_f->getPathname() );
		} else {
			@unlink( $gia_f->getPathname() );
		}
	}
	@rmdir( $gia_root );
}
