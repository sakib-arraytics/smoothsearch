<?php
/**
 * Service Container
 *
 * Singleton container implementing dependency injection with lazy loading.
 * Manages lifecycle of all plugin services.
 *
 * @package SmoothSearch
 */

namespace SmoothSearch;

defined( 'ABSPATH' ) || exit;

/**
 * Container class
 */
class Container {
	/**
	 * Singleton instance
	 *
	 * @var Container
	 */
	private static $instance = null;

	/**
	 * Registered services
	 *
	 * @var array
	 */
	private $services = array();

	/**
	 * Instantiated services cache
	 *
	 * @var array
	 */
	private $instances = array();

	/**
	 * Private constructor for singleton
	 */
	private function __construct() {
		$this->register_core_services();
	}

	/**
	 * Get singleton instance
	 *
	 * @return Container
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Register core services
	 */
	private function register_core_services() {
		// Settings service.
		$this->register(
			'settings',
			function () {
				return new Settings();
			}
		);

		// Product repository.
		$this->register(
			'repository',
			function () {
				return new ProductRepository();
			}
		);

		// Indexer service.
		$this->register(
			'indexer',
			function ( $container ) {
				return new Indexer(
					$container->get( 'repository' ),
					$container->get( 'settings' )
				);
			}
		);

		// REST API service.
		$this->register(
			'api',
			function ( $container ) {
				return new API(
					$container->get( 'settings' ),
					$container->get( 'indexer' ),
					$container->get( 'repository' )
				);
			}
		);

		// Frontend service.
		$this->register(
			'frontend',
			function ( $container ) {
				return new Frontend(
					$container->get( 'settings' )
				);
			}
		);

		// Block service.
		$this->register(
			'block',
			function () {
				return new Block();
			}
		);
	}

	/**
	 * Register a service
	 *
	 * @param string   $name Service name.
	 * @param callable $callback Factory function.
	 */
	public function register( $name, callable $callback ) {
		$this->services[ $name ] = $callback;
	}

	/**
	 * Get a service (lazy-loaded)
	 *
	 * @param string $name Service name.
	 * @return mixed Service instance.
	 * @throws \Exception If service not found.
	 */
	public function get( $name ) {
		// Return cached instance if exists.
		if ( isset( $this->instances[ $name ] ) ) {
			return $this->instances[ $name ];
		}

		// Check if service is registered.
		if ( ! isset( $this->services[ $name ] ) ) {
			/* translators: %s: Service name */
			throw new \Exception( sprintf( esc_html__( "Service '%s' not found in container.", 'smooth-search' ), esc_html( $name ) ) );
		}

		// Instantiate and cache.
		$this->instances[ $name ] = call_user_func( $this->services[ $name ], $this );

		return $this->instances[ $name ];
	}

	/**
	 * Check if service exists
	 *
	 * @param string $name Service name.
	 * @return bool
	 */
	public function has( $name ) {
		return isset( $this->services[ $name ] );
	}

	/**
	 * Clear service instance (force re-instantiation)
	 *
	 * @param string $name Service name.
	 */
	public function clear( $name ) {
		unset( $this->instances[ $name ] );
	}

	/**
	 * Prevent cloning
	 */
	private function __clone() {}

	/**
	 * Prevent unserialization
	 */
	public function __wakeup() {
		throw new \Exception( 'Cannot unserialize singleton' );
	}
}
