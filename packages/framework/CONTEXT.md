# Framework Runtime

The IGRP Next.js runtime packages (`framework-next`, `framework-next-ui`, `framework-next-auth`, `framework-next-types`) and the apps built on them: the vocabulary for what every generated app shares at request time.

## Localisation

**Platform locales**:
The fixed set of languages any IGRP app may offer: `pt`, `en`, `fr`. An app can offer fewer, never others.
_Avoid_: supported languages, available locales

**Enabled locales**:
The subset of platform locales one app offers to its users.
_Avoid_: app locales, active languages

**Locale**:
The platform locale chosen for one request; it selects which catalog every string comes from.
_Avoid_: language, lang, i18n code

**Default locale**:
The enabled locale an app falls back to when nothing about the request names another.
_Avoid_: fallback language, base locale

**Format locale**:
The region-qualified tag (e.g. `pt-CV`, `en-GB`, `fr-FR`) a deployment derives from each locale; it drives dates, numbers and the document language.
_Avoid_: region, culture, BCP-47 locale

**Locale choice**:
The user's explicit locale, remembered per browser and shared by every IGRP app on the same host; it wins over every other source.
_Avoid_: locale preference, language setting

**Session locale**:
The locale the identity provider reports for the signed-in user, carried as received; it applies only when the browser holds no locale choice, and is never copied into it.
_Avoid_: user locale, profile language

## Strings

**Catalog**:
The complete set of strings one owner provides for one locale: the design-system catalog, the chrome catalog, or the app's messages.
_Avoid_: dictionary, translations, bundle

**Chrome**:
The template surfaces every app shares — header, sidebar, user menu, auth screens, error and forbidden screens — owned by `framework-next-ui`.
_Avoid_: shell, layout, frame

**Error copy**:
The title and description shown for a platform error code; part of the chrome catalog, not of app messages.
_Avoid_: error message, error text
