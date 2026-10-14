<?php
// Run only against an isolated pinned archive with its existing vendor symlink.
require $argv[1].'/vendor/autoload.php';
$app = require $argv[1].'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$repository = $app->make(App\Contracts\Content\EventRepository::class);
$records = $repository->all();
$cases = json_decode(stream_get_contents(STDIN), true, flags: JSON_THROW_ON_ERROR);
$results = [];
foreach ($cases as $case) {
    $events = $case['records'] ?? $records;
    $repo = new class($events) implements App\Contracts\Content\EventRepository {
        public function __construct(private array $records) {}
        public function all(): array { return $this->records; }
        public function featuredUpcoming(int $limit = 3): array { throw new LogicException('Not called by listing service'); }
        public function find(string $slug): ?array { return null; }
        public function exists(string $slug): bool { return false; }
        public function findOrFail(string $slug): array { throw new LogicException('Not called by listing service'); }
    };
    $service = new App\Services\Events\EventListingService($repo);
    $now = new Carbon\CarbonImmutable($case['instant']);
    $query = is_string($case['query'] ?? null) ? trim($case['query']) : null;
    $results[] = [
        'name' => $case['name'], 'instant' => $case['instant'],
        'present' => array_map(fn(array $e): array => $service->present($e, $now), $events),
        'build' => $service->build($query, $now), 'archive' => $service->archive($now),
    ];
}
echo json_encode(['sourceRevision' => '9872c4ed12aa48835eab71065c69b468424adb4a', 'records' => $records, 'cases' => $results], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)."\n";
