![Logo](admin/megabas.png)

# ioBroker.megabas

[![NPM version](http://img.shields.io/npm/v/iobroker.megabas.svg)](https://www.npmjs.com/package/iobroker.megabas)
[![Downloads](https://img.shields.io/npm/dm/iobroker.megabas.svg)](https://www.npmjs.com/package/iobroker.megabas)
![Number of Installations (latest)](http://iobroker.live/badges/megabas-installed.svg)
![Number of Installations (stable)](http://iobroker.live/badges/megabas-stable.svg)
[![Dependency Status](https://img.shields.io/david/FlorianGrubert/iobroker.megabas.svg)](https://david-dm.org/FlorianGrubert/iobroker.megabas)
[![Known Vulnerabilities](https://snyk.io/test/github/FlorianGrubert/ioBroker.megabas/badge.svg)](https://snyk.io/test/github/FlorianGrubert/ioBroker.megabas)

[![NPM](https://nodei.co/npm/iobroker.megabas.png?downloads=true)](https://nodei.co/npm/iobroker.megabas/)

**Tests:** ![Test and Release](https://github.com/FlorianGrubert/ioBroker.megabas/workflows/Test%20and%20Release/badge.svg)

## megabas adapter for ioBroker

Adapter to use the Building Automation Stackable Card for Raspberry Pi from Sequent Technologies

## Developer manual

This section is intended for the developer. It can be deleted later

### Getting started

You are almost done, only a few steps left:

1. Create a new repository on GitHub with the name `ioBroker.megabas`

1. Push all files to the GitHub repo. The creator has already set up the local repository for you:
    ```bash
    git push origin master
    ```
1. Add a new secret under https://github.com/FlorianGrubert/ioBroker.megabas/settings/secrets. It must be named `AUTO_MERGE_TOKEN` and contain a personal access token with push access to the repository, e.g. yours. You can create a new token under https://github.com/settings/tokens.

1. Head over to [src/main.ts](src/main.ts) and start programming!

### Best Practices

We've collected some [best practices](https://github.com/ioBroker/ioBroker.repositories#development-and-coding-best-practices) regarding ioBroker development and coding in general. If you're new to ioBroker or Node.js, you should
check them out. If you're already experienced, you should also take a look at them - you might learn something new :)

### Scripts in `package.json`

Several npm scripts are predefined for your convenience. You can run them using `npm run <scriptname>`
| Script name | Description |
|-------------|-------------|
| `build:parcel` | Compile the React sources. |
| `watch:parcel` | Compile the React sources and watch for changes. |
| `build:ts` | Compile the TypeScript sources. |
| `watch:ts` | Compile the TypeScript sources and watch for changes. |
| `watch` | Shortcut for `npm run watch:ts` |
| `build` | Compile the TypeScript and the React sources. |
| `test:ts` | Executes the tests you defined in `*.test.ts` files. |
| `test:package` | Ensures your `package.json` and `io-package.json` are valid. |
| `test:unit` | Tests the adapter startup with unit tests (fast, but might require module mocks to work). |
| `test:integration` | Tests the adapter startup with an actual instance of ioBroker. |
| `test` | Performs a minimal test run on package files and your tests. |
| `check` | Performs a type-check on your code (without compiling anything). |
| `lint` | Runs `ESLint` to check your code for formatting errors and potential bugs. |

### Writing tests

When done right, testing code is invaluable, because it gives you the
confidence to change your code while knowing exactly if and when
something breaks. A good read on the topic of test-driven development
is https://hackernoon.com/introduction-to-test-driven-development-tdd-61a13bc92d92.
Although writing tests before the code might seem strange at first, but it has very
clear upsides.

The template provides you with basic tests for the adapter startup and package files.
It is recommended that you add your own tests into the mix.

### Publishing the adapter

Since you have chosen GitHub Actions as your CI service, you can
enable automatic releases on npm whenever you push a new git tag that matches the form
`v<major>.<minor>.<patch>`. The necessary steps are described in `.github/workflows/test-and-release.yml`.

To get your adapter released in ioBroker, please refer to the documentation
of [ioBroker.repositories](https://github.com/ioBroker/ioBroker.repositories#requirements-for-adapter-to-get-added-to-the-latest-repository).

### Test the adapter manually on a local ioBroker installation

In order to install the adapter locally without publishing, the following steps are recommended:

1. Create a tarball from your dev directory:
    ```bash
    npm pack
    ```
1. Upload the resulting file to your ioBroker host
1. Install it locally (The paths are different on Windows):
    ```bash
    cd /opt/iobroker
    npm i /path/to/tarball.tgz
    ```

For later updates, the above procedure is not necessary. Just do the following:

1. Overwrite the changed files in the adapter directory (`/opt/iobroker/node_modules/iobroker.megabas`)
1. Execute `iobroker upload megabas` on the ioBroker host

## Changelog

### 0.1.2

-   Writing readonly values with ack flag to prevent warnings


### 0.1.1

-   (Florian Grubert) first working release with lighting devices.
-   Basic functionality, only the port types for 0-10V and dry contact input ports are supported
-   DAC output ports work but triac ports are not yet supported

### 0.0.1

-   (Florian Grubert) initial release

## License

MIT License

Copyright (c) 2020 Florian Grubert <privat@fgrubert.de>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
