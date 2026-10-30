<?php
// Remoção do plugin pelo painel: apaga a chave do formulário guardada no banco.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}
delete_option( 'geometria_lab_key' );
delete_option( 'geometria_lab_endpoint' );
delete_option( 'geometria_lab_cache_version' );
