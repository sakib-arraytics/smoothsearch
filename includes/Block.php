<?php
/**
 * Gutenberg Block Registration
 *
 * Registers a custom Gutenberg block for the search bar.
 *
 * @package SmoothSearch
 */

namespace SmoothSearch;

defined( 'ABSPATH' ) || exit;

/**
 * Block class
 */
class Block {
	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'register_block' ) );
	}

	/**
	 * Register Gutenberg block
	 */
	public function register_block() {
		// Register block script.
		wp_register_script(
			'smooth-search-block',
			SMOOTH_SEARCH_URL . 'assets/js/block.js',
			array( 'wp-blocks', 'wp-element', 'wp-editor', 'wp-components' ),
			SMOOTH_SEARCH_VERSION,
			true
		);

		// Register block.
		register_block_type(
			'smooth-search/search-bar',
			array(
				'editor_script'   => 'smooth-search-block',
				'render_callback' => array( $this, 'render_block' ),
				'attributes'      => array(
					'placeholder' => array(
						'type'    => 'string',
						'default' => 'Search products...',
					),
				),
			)
		);
	}

	/**
	 * Render block on frontend
	 *
	 * @param array $attributes Block attributes.
	 * @return string
	 */
	public function render_block( $attributes ) {
		// Use the same shortcode rendering.
		$container = \SmoothSearch\Container::instance();
		$frontend  = $container->get( 'frontend' );
		
		return $frontend->render_search_bar();
	}
}
