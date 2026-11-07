# Partnership country reference

Read-only snapshot of the existing workspace world-countries.json reference; no Laravel code or connection is used. Only country codes, labels and dialing prefixes are retained. These entries do not imply active markets or approved partnerships.

# Country reference data

250 country/territory entries: ISO alpha-2/alpha-3 entries plus Kosovo (user-assigned XK/XKX). Arabic country labels are used in the nationality selector, consistent with the existing Country model.

Sources retrieved 2026-09-26:
- https://github.com/annexare/Countries (country codes, English names, first listed dialing prefix and currency).
- https://github.com/umpirsky/country-list (Arabic labels, data/ar/country.json).
- Kosovo Arabic label: كوسوفو; current calling prefix +383.

The import only adds missing records. It preserves existing country IDs, names, active status and market policy. New records are available as country references, with market_enabled=false. Markets and payment gateway associations require administrator configuration. No existing currencies or gateways are modified.

## Annexare license

The MIT License (MIT)

Copyright (c) 2014 Annexare Studio

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
## country-list license

Copyright (c) Saša Stamenković <umpirsky@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

