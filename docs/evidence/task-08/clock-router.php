<?php
// Copy this file into the isolated pinned archive; run PHP from its public directory.
require __DIR__.'/vendor/autoload.php';
$instant = trim(file_get_contents('/tmp/nosee-task08-clock.txt'));
Carbon\CarbonImmutable::setTestNow(new Carbon\CarbonImmutable($instant));
Carbon\Carbon::setTestNow(new Carbon\Carbon($instant));
// Propagate false so PHP serves existing CSS/JS/fonts/images as static files.
return require __DIR__.'/vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php';
