# Rate-limit Scheduler

> This library helps you respect the rate-limits that services apply to their APIs.


Consuming APIs of 3rd party services often requires to deal with rate limits 
(such as that of [Github](https://developer.github.com/v3/rate_limit/)).
Properly managing these constraints is not an obvious task and if done improperly, your service will
most likely be forbidden access to said service.

This library provides your code with a scheduler that will hold requests in respect to the rate-limits
that the services you are consuming apply.

## Installation

```sh
$ npm install --dev rate-limit-scheduler
```

## Usage

In order to use the scheduler, you will need to write 2 functions:
* an action: typically, a function performing the API call
* an updater: a function that uses the return of the action to update the rate limits (typically, using headers or metadata)

You will find a demo of the scheduler with the Github API in the file `demos/github.js`.

Generally speaking, you will do:

```js
let RateLimitScheduler = require('rate-limit-scheduler')
let scheduler = new RateLimitScheduler()

let result = await scheduler.schedule(actionFn, rateUpdaterFn)
```

### The action function `actionFn`

This function is your actual call to your rate-limited service.
Async functions are supported.

```js
async function actionFn() {
  return await fetch('https://api.a-service.com/me?token=ABCDEFGH')
}
```

### The update function `rateUpdaterFn`

This function will update the limits that the scheduler will adhere to.

```js
function rateUpdaterFn(res) {
  return {
    limit: res.headers['x-ratelimit-limit'],
    reset: res.headers['x-ratelimit-reset'] * 1000,
    remaining: res.headers['x-ratelimit-remaining']
  }
}
```

The following properties are expected:
* `limit`: (optional) The maximum number of requests per timeframe.
* `reset`: An [UNIX Epoch time](https://en.wikipedia.org/wiki/Unix_time) indicating when the counter of allowed requests will be reset to `limit`.
* `remaining`: The number of remaining requests before being refused to access the API.

## License

Licensed under the MIT License.

See [LICENSE.md](LICENSE.md)

© 2019 PeopleDoc SAS and the contributors
