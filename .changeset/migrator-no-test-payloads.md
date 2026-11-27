---
"@igrp/template-migrator": patch
---

The package no longer ships test files. A `file.delete` step now carries the hash of its `expect` payload (`expectHash`) instead of the file, so the 7 test files from migrations 92 and 94 are gone from `dist/payload`. Migration hashes do not change, so apps that already applied 102 see nothing new.
