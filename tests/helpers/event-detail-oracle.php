<?php
// The caller must provide an isolated pinned archive with writable runtime folders.
require $argv[1].'/vendor/autoload.php';
$app = require $argv[1].'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$repo = $app->make(App\Contracts\Content\EventRepository::class);
$detail = $app->make(App\Services\Events\EventDetailService::class);
$listing = $app->make(App\Services\Events\EventListingService::class);
$input = json_decode(stream_get_contents(STDIN), true, flags: JSON_THROW_ON_ERROR);
$cases = [];
foreach ($input['instants'] as $instant) {
    $now = new Carbon\CarbonImmutable($instant);
    $events = [];
    foreach ($repo->all() as $event) $events[$event['slug']] = $detail->find($event['slug'], $now);
    $cases[] = ['instant' => $instant, 'events' => $events, 'missing' => $detail->find('missing-event', $now)];
}
$synthetic = $listing->present($input['synthetic'], new Carbon\CarbonImmutable($input['instants'][0]), true);
echo json_encode(['records' => $repo->all(), 'cases' => $cases, 'synthetic' => $synthetic,
    'syntheticHtml' => view('events.show', ['event' => $synthetic])->render()],
    JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
