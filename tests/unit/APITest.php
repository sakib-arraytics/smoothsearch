<?php
use PHPUnit\Framework\TestCase;
use SmoothSearch\API;
use SmoothSearch\Settings;
use SmoothSearch\Indexer;
use SmoothSearch\ProductRepository;

class APITest extends TestCase {
	private $api;
	private $settings;
	private $indexer;
	private $repository;

	protected function setUp(): void {
		parent::setUp();
		// Create mocks using Mockery
		$this->settings   = Mockery::mock( Settings::class );
		$this->indexer    = Mockery::mock( Indexer::class );
		$this->repository = Mockery::mock( ProductRepository::class );

		$this->api = new API( $this->settings, $this->indexer, $this->repository );
	}

	protected function tearDown(): void {
		Mockery::close();
	}

	public function test_get_settings() {
		$mock_data = [ 'enabled' => true, 'min_chars' => 3 ];
		
		$this->settings->shouldReceive( 'get_all' )
		               ->once()
		               ->andReturn( $mock_data );

		$response = $this->api->get_settings();

		$this->assertInstanceOf( 'WP_REST_Response', $response );
		$data = $response->get_data();
		$this->assertTrue( $data['success'] );
		$this->assertEquals( $mock_data, $data['data'] );
	}

	public function test_update_settings() {
		$new_settings = [ 'enabled' => false ];
		$request = new WP_REST_Request();
		$request->set_json_params( $new_settings );

		$this->settings->shouldReceive( 'update' )
		               ->once()
		               ->with( $new_settings )
		               ->andReturn( true );
		
		$this->settings->shouldReceive( 'get_all' )
		               ->once()
		               ->andReturn( $new_settings );

		$response = $this->api->update_settings( $request );
		$data = $response->get_data();

		$this->assertTrue( $data['success'] );
		$this->assertEquals( $new_settings, $data['data'] );
	}

	public function test_get_health() {
		$status = [ 'status' => 'healthy', 'product_count' => 100 ];
		
		$this->indexer->shouldReceive( 'get_status' )
		              ->once()
		              ->andReturn( $status );

		$response = $this->api->get_health();
		$data = $response->get_data();

		$this->assertTrue( $data['success'] );
		$this->assertEquals( $status, $data['data'] );
	}

	public function test_trigger_rebuild_success() {
		$this->indexer->shouldReceive( 'start_rebuild' )
		              ->once()
		              ->andReturn( true );

		$response = $this->api->trigger_rebuild();
		$data = $response->get_data();

		$this->assertTrue( $data['success'] );
		$this->assertEquals( 'Index rebuild started', $data['message'] );
	}

	public function test_trigger_rebuild_failure() {
		$this->indexer->shouldReceive( 'start_rebuild' )
		              ->once()
		              ->andReturn( false );

		$response = $this->api->trigger_rebuild();
		$data = $response->get_data();

		$this->assertFalse( $data['success'] );
		$this->assertEquals( 'Failed to start rebuild', $data['message'] );
	}
}
