# Changelog

## [0.3.0](https://github.com/pataruco/el-guacal/compare/server-v0.2.1...server-v0.3.0) (2026-02-22)


### Features

* add firebase deployment workflow for web app ([56ae226](https://github.com/pataruco/el-guacal/commit/56ae226fb14f26829680c020ab50311be9ee1a49))
* add firebase deployment workflow for web app ([587c66f](https://github.com/pataruco/el-guacal/commit/587c66fa5e0ac4e3cabbd3e1d94a38502c421360))


### Bug Fixes

* **server:** conditionally initialize OTLP telemetry ([07179aa](https://github.com/pataruco/el-guacal/commit/07179aa23465423760458e9a62e43a4c508ebdbf))
* **server:** conditionally initialize OTLP telemetry ([74f779c](https://github.com/pataruco/el-guacal/commit/74f779c2cde5ebb9acabd5bf327989fbc5ff1ea2))

## [0.2.1](https://github.com/pataruco/el-guacal/compare/server-v0.2.0...server-v0.2.1) (2026-02-22)


### Bug Fixes

* conditional telemetry initialization ([02bdae0](https://github.com/pataruco/el-guacal/commit/02bdae014fe662d422d6458e114ed4032c8409a8))
* **server:** conditionally initialize OTLP telemetry ([fca32e4](https://github.com/pataruco/el-guacal/commit/fca32e47880428297274a286689f5d7c59692a0d))
* **server:** conditionally initialize OTLP telemetry ([99d2318](https://github.com/pataruco/el-guacal/commit/99d2318e5b9c0c1b617b6725b9814b7ce46dad61))
* **server:** conditionally initialize OTLP telemetry ([a26acc9](https://github.com/pataruco/el-guacal/commit/a26acc9f3ac3212a302037b598bf407b901acece))

## [0.2.0](https://github.com/pataruco/el-guacal/compare/server-v0.1.0...server-v0.2.0) (2026-02-22)


### Features

* add /health endpoint and configure Cloud Run probes ([96e34a5](https://github.com/pataruco/el-guacal/commit/96e34a5b073c750b5a0b7ca96d2154dcebfc97c7))
* add /health endpoint and configure Cloud Run probes ([1324665](https://github.com/pataruco/el-guacal/commit/13246651bfe6e754a4eb1bc0b3e7d18805109fc5))
* add OTLP logging and tracing to server ([49be735](https://github.com/pataruco/el-guacal/commit/49be735a61086e40fd16418429674d33b5345a8e))
* add OTLP logging and tracing to server ([af0a99c](https://github.com/pataruco/el-guacal/commit/af0a99c9fcdbea92c16ad088b562d38eb7ec4b42))
* complete OTLP observability with GraphQL and SQLx logging ([a7a4347](https://github.com/pataruco/el-guacal/commit/a7a43476610f47b7cce3fce127198920d69eb864))
* fix clippy lints in telemetry and main ([ce757f1](https://github.com/pataruco/el-guacal/commit/ce757f18e1813ed81e007abb9acb95a35880c5dd))
* get store by id ([e33be3a](https://github.com/pataruco/el-guacal/commit/e33be3abfd20700dfa8478a144d836a473d423f9))
* get store by id ([7550194](https://github.com/pataruco/el-guacal/commit/7550194029ff2d0e8db3ebdc6e4b6c3faa3bbb84))
* get store by id ([8e9a356](https://github.com/pataruco/el-guacal/commit/8e9a3562e6b68f4b90a772ed4bec1655a25f1cc8))
* getting data from guacal server ([f32e604](https://github.com/pataruco/el-guacal/commit/f32e60475e847d4b9d29ef2517304285670a11cc))
* graphql integration ([827ff5c](https://github.com/pataruco/el-guacal/commit/827ff5c6f19aee52d038e566a19e2bff453e39a8))
* map search radius to Google Maps zoom levels ([1c3f568](https://github.com/pataruco/el-guacal/commit/1c3f568a53457b60b05b8ecd662460674da88def))


### Bug Fixes

* conditional telemetry initialization ([02bdae0](https://github.com/pataruco/el-guacal/commit/02bdae014fe662d422d6458e114ed4032c8409a8))
* **server:** conditionally initialize OTLP telemetry ([fca32e4](https://github.com/pataruco/el-guacal/commit/fca32e47880428297274a286689f5d7c59692a0d))
* **server:** conditionally initialize OTLP telemetry ([99d2318](https://github.com/pataruco/el-guacal/commit/99d2318e5b9c0c1b617b6725b9814b7ce46dad61))
* **server:** conditionally initialize OTLP telemetry ([a26acc9](https://github.com/pataruco/el-guacal/commit/a26acc9f3ac3212a302037b598bf407b901acece))

## 0.1.0 (2026-02-18)


### Features

* add unit/integration tests and migration mechanism ([7472b5d](https://github.com/pataruco/el-guacal/commit/7472b5db2548301822fc2daa4145e9ff1e5b9ddb))
* get locations ([28985a4](https://github.com/pataruco/el-guacal/commit/28985a47d9602e74d7cbdded515f01c9dc76e4b0))
* get store from locations ([ba0ae2d](https://github.com/pataruco/el-guacal/commit/ba0ae2da501bb6b5c9af86588cf899c2de87eb3f))
* migrate from Diesel to sqlx and implement spatial GraphQL queries ([53336e3](https://github.com/pataruco/el-guacal/commit/53336e302098385dee7c8f459aef82d49618353c))
* migrate from Diesel to sqlx and implement spatial GraphQL queries ([6b39dee](https://github.com/pataruco/el-guacal/commit/6b39dee11b14a98f407e6301c4a78e988c40aca1))
* scaffold a graphql server ([f6dc34c](https://github.com/pataruco/el-guacal/commit/f6dc34c8c3461f019716844ba8dc8e46afda1b05))
* **server:** add unit/integration tests and migration mechanism ([7d90afa](https://github.com/pataruco/el-guacal/commit/7d90afa8f6e38d0f3fd65943262da68b0e9b07a2))
