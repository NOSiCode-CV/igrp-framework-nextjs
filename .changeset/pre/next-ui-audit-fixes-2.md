---
'@igrp/framework-next-ui': patch
---

The error boundaries show only the id part of an `AppError` digest as the error reference, so the message is no longer repeated. Command search matches the label and group only: typing a digit no longer matches every item through its id or position. Each word typed matches on its own, accent- and case-insensitively, so "rel con" finds "Relatórios Contabilísticos".
