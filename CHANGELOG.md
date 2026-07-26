# [1.2.0](https://github.com/pchuri/chrome-cookie-extractor/compare/v1.1.1...v1.2.0) (2026-07-26)


### Bug Fixes

* **decryptor:** correct macOS v10 cookie decryption (wrong key + M130 domain hash) ([#3](https://github.com/pchuri/chrome-cookie-extractor/issues/3)) ([f4f6ed5](https://github.com/pchuri/chrome-cookie-extractor/commit/f4f6ed576a05a2ea4bec1fb3da56e369d0ca2b02))


### Features

* **auth-curl:** add --max-time and --connect-timeout passthrough to curl ([#4](https://github.com/pchuri/chrome-cookie-extractor/issues/4)) ([5e46715](https://github.com/pchuri/chrome-cookie-extractor/commit/5e467155ec060931a0a64e25bd603967fcf6b3c8))
* **auth-curl:** forward unknown curl flags to the underlying curl ([#6](https://github.com/pchuri/chrome-cookie-extractor/issues/6)) ([6739734](https://github.com/pchuri/chrome-cookie-extractor/commit/67397345a1316d3796019173ef9e0c7a79b2fd5d))

## [1.1.1](https://github.com/pchuri/chrome-cookie-extractor/compare/v1.1.0...v1.1.1) (2025-07-15)


### Bug Fixes

* **decryptor:** accept Uint8Array/other buffers in decryptValue ([#1](https://github.com/pchuri/chrome-cookie-extractor/issues/1)) ([6c85dc0](https://github.com/pchuri/chrome-cookie-extractor/commit/6c85dc0c13668be1814bccce6de15d092623131d))

# [1.1.0](https://github.com/pchuri/chrome-cookie-extractor/compare/v1.0.1...v1.1.0) (2025-06-30)


### Features

* trigger new clean release without strange assets ([ff509d3](https://github.com/pchuri/chrome-cookie-extractor/commit/ff509d3c05c693356a39a330ed1210b15cfd777c))

## [1.0.1](https://github.com/pchuri/chrome-cookie-extractor/compare/v1.0.0...v1.0.1) (2025-06-30)


### Bug Fixes

* remove unnecessary release assets from GitHub releases ([29bdb1a](https://github.com/pchuri/chrome-cookie-extractor/commit/29bdb1a06ac0115576e7323a029101e445e2c1d2))

# 1.0.0 (2025-06-30)


### Bug Fixes

* resolve ESLint configuration and linting errors ([58b4163](https://github.com/pchuri/chrome-cookie-extractor/commit/58b41634b5e3d326d92288779659ada592931aef))
* update tests to match actual API implementation ([c143f77](https://github.com/pchuri/chrome-cookie-extractor/commit/c143f77c9b37b854867425056cb2b50b54ee7c6f))


### Features

* enhance project with professional CI/CD and quality tools ([717a38b](https://github.com/pchuri/chrome-cookie-extractor/commit/717a38b443987d6b22594153845ce8e6a928b07f))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Initial development version - releases will be automatically generated using semantic-release.
