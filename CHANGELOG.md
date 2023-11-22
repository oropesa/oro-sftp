## 2.0.2 / 2023-11-02
* Fixed _github action_ `npm_publish_on_pr_merge_to_master`.
* Updated libs:
  * `fs-extra` to `v11.1.1`.
  * `oro-functions` from `v2.0.0` to `v2.0.2`.
* Updated _dev_ libs:
  * `@babel/core` from `v7.23.2` to `v7.23.3`.
  * `@babel/preset-env` from `v7.23.2` to `v7.23.3`.
  * `@babel/preset-typescript` from `v7.23.2` to `v7.23.3`.
  * `@types/fs-extra` from `v11.0.3` to `v11.0.4`.
  * `@types/jest` from `v29.5.7` to `v29.5.10`.
  * `@types/ssh2-sftp-client` from `v9.0.2` to `v9.0.3`.
  * `@typescript-eslint/eslint-plugin` from `v6.9.1` to `v6.12.0`.
  * `@typescript-eslint/parser` from `v6.9.1` to `v6.12.0`.
  * `eslint` from `v8.52.0` to `v8.54.0`.
  * `prettier` from `v3.0.3` to `v3.1.0`.
  * `tsup` from `v7.2.0` to `v8.0.1`.
* Removed non-used _dev_ libs:
  * `@nearst/ftp`.

## 2.0.1 / 2023-11-02
* Updated _dev_ libs:
  * `@types/ssh2-sftp-client` to `v9.0.2`.

## 2.0.0 / 2023-11-02
**NOTE:**<br>
⚠️ It's not valid anymore:<br>`const OSFtp = require('oro-sftp')`,<br>
✔️ use the following instead:<br>`const { OSFtp } = require('oro-sftp')`

* Refactored `./index.js` to `./src/index.ts`.
* Updated _package_ as `type: "module"`.
* Added `tsup` and now _package_ is compiled to `cjs` _(common)_ and `mjs` _(module)_.
* Added _github actions_:
    * `validate_pr_to_master`
    * `npm_publish_on_pr_merge_to_master`.
* Added `husky` (to ensure only valid commits).
* Added `eslint` (and applied it).
* Added `prettier` (and applied it).
* Updated _package description_
* Updated libs:
    * `oro-functions` to `v2.0.0`.
* Updated _dev_ libs:
    * `@babel/core` to `v7.23.2`.
    * `@babel/preset-env` to `v7.23.2`.
    * `@babel/preset-typescript` to `v7.23.2`.
    * `@types/jest` to `v29.5.7`.
    * `@types/fs-extra` to `v11.0.3`.
    * `@types/promise-ftp` to `v1.3.7`.
    * `babel-jest` to `v29.7.0`.
    * `jest` to `v29.7.0`.

## 1.1.0 / 2023-07-04
* Added `TS` support.
* Added _ts tests_.
* Added `package-lock.json`.
* Improved _tests_.
* Improved _readme_.
* Improved _error messages_ and added param `code` in _responseKO error_.
* Fixed reducing duration of _connection timeout_ when fails.
* Fixed method `delete` allowing to remove folder (as `rmdir`) when it's empty.
* Updated lib `oro-functions` to `v1.3.2`.
* Updated lib `ssh2-sftp-client` to `v9.1.0`.
* Updated lib-dev `jest` to `v29.5.0`.

## 1.0.3 / 2022-06-21
* Updated lib `oro-functions` to `v1.1.7`.
* Updated lib-dev `jest` to `v28.1.1`.

## 1.0.0 / 2022-05-26
* Added `MIT License`.
* Added _unit testing_ `Jest`.
* Added _package_ in `github.com` & `npmjs.com`.
* Updated lib `oro-functions` to `^v1.1.4`.
* Updated lib `ssh2-sftp-client` to `^v8.1.0`.

## 0.1.3 / 2021-12-13
* Updated lib `oro-functions` to `v1.0.2`.
* Updated lib `ssh2-sftp-client` to `v7.1.0`.

## 0.1.2 / 2021-11-30
* Updated lib `ssh2-sftp-client` to `v7.1.0`.

## 0.1.1 / 2021-11-16
* Update `oro-functions` to _v1.0.1_.

## 0.1.0 / 2021-06-18
* Added methods `list`, `move`, `delete`, `exists`, `mkdir`, `rmdir`.
* Fixed `readme.md information` and _error object_ of `upload`, `download`, `disconnect`.
* Updated lib `oro-functions`.

## 0.0.3 / 2021-05-07
* Fixed _constructor_ `param:config`.
* Fixed _constructor_ `param:config.user` is changed by `param:config.username`.
* Fixed avoid `tryAgain` when _connect_ failed by _wrong username_.

## 0.0.2 / 2021-05-07
* Added changelog.
* Fixed _constructor_ `param:config`.
* Updated npm `oro-functions` to `v0.9.1`.
