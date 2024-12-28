## 2.1.2 / 2024-12-28
- Improve `eslint.config.js`.
- Update libs:
  - `oro-functions` from `v2.3.2` to `v2.3.4`.
- Added _dev_ libs:
  - `eslint-plugin-jest-dom` added `v5.5.0`.
  - `eslint-plugin-prettier` added `v5.2.1`.
- Update _dev_ libs:
  - `@babel/core` from `v7.25.2` to `v7.26.0`.
  - `@babel/preset-env` from `v7.25.4` to `v7.26.0`.
  - `@babel/preset-typescript` from `v7.24.7` to `v7.26.0`.
  - `@eslint/js` from `v9.11.1` to `v9.17.0`.
  - `@trivago/prettier-plugin-sort-imports` from `v4.3.0` to `v5.2.0`.
  - `@types/jest` from `v29.5.13` to `v29.5.14`.
  - `eslint` from `v9.11.1` to `v9.17.0`.
  - `eslint-plugin-jest` from `v28.8.3` to `v28.10.0`.
  - `eslint-plugin-unicorn` from `v55.0.0` to `v56.0.1`.
  - `globals` from `v15.9.0` to `v15.14.0`.
  - `husky` from `v9.1.6` to `v9.1.7`.
  - `nodemon` from `v3.1.7` to `v3.1.9`.
  - `prettier` from `v3.3.3` to `v3.4.2`.
  - `tsup` from `v8.3.0` to `v8.3.5`.
  - `typescript` from `v5.5.4` to `v5.7.2`.
  - `typescript-eslint` from `v8.7.0` to `v8.18.2`.

## 2.1.1 / 2024-09-24

- Apply `prettier --write` in the whole project (with `endOfLine: 'lf'`).
- Fix eslint `@typescript-eslint/no-unused-expressions` rule in code.
- Update `eslint` _breakpoint version_ (v8 to v9).
- Update typescript _target_ to `ES2020`.
- Updated libs:
  - `oro-functions-client` from `v2.3.1` to `v2.3.2`.
  - `ssh2-sftp-client` from `v10.0.3` to `v11.0.0`.
- Updated _dev_ libs:
  - `@babel/core` from `v7.24.9` to `v7.25.2`.
  - `@babel/preset-env` from `v7.24.8` to `v7.25.4`.
  - `@eslint/js` from `v9.7.0` to `v9.11.1`.
  - `@types/jest` from `v29.5.12` to `v29.5.13`.
  - `@types/ssh2-sftp-client` from `v9.0.3` to `v9.0.4`.
  - `eslint` from `v8.57.0` to `v9.11.1`.
  - `eslint-plugin-jest` from `v28.6.0` to `v28.8.3`.
  - `eslint-plugin-unicorn` from `v54.0.0` to `v55.0.0`.
  - `globals` from `v15.8.0` to `v15.9.0`.
  - `husky` from `v9.1.1` to `v9.1.6`.
  - `nodemon` from `v3.1.4` to `v3.1.7`.
  - `tsup` from `v8.2.2` to `v8.3.0`.
  - `typescript-eslint` from `v7.17.0` to `v8.7.0`.

## 2.1.0 / 2024-07-23

- Re-init `package-lock.json`.
- Added _coverage_ for testing.
- Added _watcher_ for coding.
- Updated _eslint_ to flat `eslint.config.js`.
- Improved `OSftp.list` to return always a sortened list by name.
- Improved _github cicd_ adding a sftp-server as a service for testing.
- Improved _github cicd_ replacing `actions/--@v3` by `actions/--@v4`, and replacing `npm install` to `npm ci`.
- Improved `export` declarations in index files.
- Enhanced _linter_ adding some extensions.
- Enhanced _prettier_ adding import-sorter.
- Updated _prettier_ `printWidth: 120`
- Simplified `tsup.config.ts`.
- Moved _tests_ inside `src` and simplified `*.test.ts`.
- Enhanced testing to achieve over `987%` of coverage (yay!).
- Updated libs:
  - `fs-extra` from `v11.1.1` to `v11.2.0`.
  - `oro-functions` from `v2.0.2` to `v2.3.1`.
  - `ssh2-sftp-client` from `v9.1.0` to `v10.0.3`.
- Added _dev_ libs:
  - `@eslint/js`
  - `@trivago/prettier-plugin-sort-imports`
  - `eslint-config-prettier`
  - `eslint-plugin-jest`
  - `globals`
  - `nodemon`
  - `typescript-eslint`
- Updated _dev_ libs:
  - `@babel/core` from `v7.23.3` to `v7.24.9`.
  - `@babel/preset-env` from `v7.23.` to `v7.24.8`.
  - `@babel/preset-typescript` from `v7.23.3` to `v7.24.7`.
  - `@types/jest` from `v29.5.10` to `v29.5.12`.
  - `eslint` from `v8.54.0` to `v^^8.57.0`.
  - `eslint-plugin-unicorn` from `v49.0.0` to `v54.0.0`.
  - `husky` from `v8.0.3` to `v9.1.1`.
  - `prettier` from `v3.1.0` to `v3.3.3`.
  - `tsup` from `v8.0.1` to `v8.2.2`.
  - `typescript` from `v5.2.2` to `v5.5.4`.
- Removed _dev_ libs:
  - `@typescript-eslint/eslint-plugin` removed.
  - `@typescript-eslint/parser` removed.
  - `eslint-config-alloy` removed.

## 2.0.2 / 2023-11-02

- Fixed _github action_ `npm_publish_on_pr_merge_to_master`.
- Updated libs:
  - `fs-extra` to `v11.1.1`.
  - `oro-functions` from `v2.0.0` to `v2.0.2`.
- Updated _dev_ libs:
  - `@babel/core` from `v7.23.2` to `v7.23.3`.
  - `@babel/preset-env` from `v7.23.2` to `v7.23.3`.
  - `@babel/preset-typescript` from `v7.23.2` to `v7.23.3`.
  - `@types/fs-extra` from `v11.0.3` to `v11.0.4`.
  - `@types/jest` from `v29.5.7` to `v29.5.10`.
  - `@types/ssh2-sftp-client` from `v9.0.2` to `v9.0.3`.
  - `@typescript-eslint/eslint-plugin` from `v6.9.1` to `v6.12.0`.
  - `@typescript-eslint/parser` from `v6.9.1` to `v6.12.0`.
  - `eslint` from `v8.52.0` to `v8.54.0`.
  - `prettier` from `v3.0.3` to `v3.1.0`.
  - `tsup` from `v7.2.0` to `v8.0.1`.
- Removed non-used _dev_ libs:
  - `@nearst/ftp`.

## 2.0.1 / 2023-11-02

- Updated _dev_ libs:
  - `@types/ssh2-sftp-client` to `v9.0.2`.

## 2.0.0 / 2023-11-02

**NOTE:**<br>
⚠️ It's not valid anymore:<br>`const OSFtp = require('oro-sftp')`,<br>
✔️ use the following instead:<br>`const { OSFtp } = require('oro-sftp')`

- Refactored `./index.js` to `./src/index.ts`.
- Updated _package_ as `type: "module"`.
- Added `tsup` and now _package_ is compiled to `cjs` _(common)_ and `mjs` _(module)_.
- Added _github actions_:
  - `validate_pr_to_master`
  - `npm_publish_on_pr_merge_to_master`.
- Added `husky` (to ensure only valid commits).
- Added `eslint` (and applied it).
- Added `prettier` (and applied it).
- Updated _package description_
- Updated libs:
  - `oro-functions` to `v2.0.0`.
- Updated _dev_ libs:
  - `@babel/core` to `v7.23.2`.
  - `@babel/preset-env` to `v7.23.2`.
  - `@babel/preset-typescript` to `v7.23.2`.
  - `@types/jest` to `v29.5.7`.
  - `@types/fs-extra` to `v11.0.3`.
  - `@types/promise-ftp` to `v1.3.7`.
  - `babel-jest` to `v29.7.0`.
  - `jest` to `v29.7.0`.

## 1.1.0 / 2023-07-04

- Added `TS` support.
- Added _ts tests_.
- Added `package-lock.json`.
- Improved _tests_.
- Improved _readme_.
- Improved _error messages_ and added param `code` in _responseKO error_.
- Fixed reducing duration of _connection timeout_ when fails.
- Fixed method `delete` allowing to remove folder (as `rmdir`) when it's empty.
- Updated lib `oro-functions` to `v1.3.2`.
- Updated lib `ssh2-sftp-client` to `v9.1.0`.
- Updated lib-dev `jest` to `v29.5.0`.

## 1.0.3 / 2022-06-21

- Updated lib `oro-functions` to `v1.1.7`.
- Updated lib-dev `jest` to `v28.1.1`.

## 1.0.0 / 2022-05-26

- Added `MIT License`.
- Added _unit testing_ `Jest`.
- Added _package_ in `github.com` & `npmjs.com`.
- Updated lib `oro-functions` to `^v1.1.4`.
- Updated lib `ssh2-sftp-client` to `^v8.1.0`.

## 0.1.3 / 2021-12-13

- Updated lib `oro-functions` to `v1.0.2`.
- Updated lib `ssh2-sftp-client` to `v7.1.0`.

## 0.1.2 / 2021-11-30

- Updated lib `ssh2-sftp-client` to `v7.1.0`.

## 0.1.1 / 2021-11-16

- Update `oro-functions` to _v1.0.1_.

## 0.1.0 / 2021-06-18

- Added methods `list`, `move`, `delete`, `exists`, `mkdir`, `rmdir`.
- Fixed `readme.md information` and _error object_ of `upload`, `download`, `disconnect`.
- Updated lib `oro-functions`.

## 0.0.3 / 2021-05-07

- Fixed _constructor_ `param:config`.
- Fixed _constructor_ `param:config.user` is changed by `param:config.username`.
- Fixed avoid `tryAgain` when _connect_ failed by _wrong username_.

## 0.0.2 / 2021-05-07

- Added changelog.
- Fixed _constructor_ `param:config`.
- Updated npm `oro-functions` to `v0.9.1`.
