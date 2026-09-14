/**
 * このアプリが利用しているオープンソースソフトウェアと、その著作権表示・
 * ライセンス全文。MITやBSDなどのライセンスは「著作権表示とライセンス全文を
 * 配布物に含めること」を条件としているため、設定画面のダイアログから
 * 常に参照できるようにしている。
 *
 * 依存を追加・更新したときはここも更新すること。
 * (node_modules/<パッケージ>/LICENSE* が一次情報)
 */

const MIT = (copyright) => `MIT License

Copyright (c) ${copyright}

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
SOFTWARE.`;

const APACHE_2_0_SUMMARY = `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/LICENSE-2.0

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

ライセンス全文は上記URLを参照してください。`;

const CC_BY_4_0_SUMMARY = `Creative Commons Attribution 4.0 International (CC BY 4.0)
https://creativecommons.org/licenses/by/4.0/

本ライセンスのもとで提供される素材は、適切なクレジットを表示することを
条件に、複製・改変・再配布・商用利用が認められています。

ライセンス全文は上記URLを参照してください。`;

export const OSS_LICENSES = [
  {
    name: "React",
    packageName: "react",
    version: "19.1.1",
    license: "MIT License",
    homepage: "https://react.dev/",
    text: MIT("Meta Platforms, Inc. and affiliates."),
  },
  {
    name: "React DOM",
    packageName: "react-dom",
    version: "19.1.1",
    license: "MIT License",
    homepage: "https://react.dev/",
    text: MIT("Meta Platforms, Inc. and affiliates."),
  },
  {
    name: "Recharts",
    packageName: "recharts",
    version: "3.1.2",
    license: "MIT License",
    homepage: "https://recharts.org/",
    text: MIT("2015-present recharts"),
  },
  {
    name: "Firebase JavaScript SDK",
    packageName: "firebase",
    version: "12.1.0",
    license: "Apache License 2.0",
    homepage: "https://firebase.google.com/",
    text: `Copyright 2017 Google Inc.\n\n${APACHE_2_0_SUMMARY}`,
  },
  {
    name: "uuid",
    packageName: "uuid",
    version: "11.1.0",
    license: "MIT License",
    homepage: "https://github.com/uuidjs/uuid",
    text: MIT("2010-2020 Robert Kieffer and other contributors"),
  },
  {
    name: "Font Awesome (React コンポーネント)",
    packageName: "@fortawesome/react-fontawesome",
    version: "0.2.5",
    license: "MIT License",
    homepage: "https://github.com/FortAwesome/react-fontawesome",
    text: MIT("2018 Fonticons, Inc."),
  },
  {
    name: "Font Awesome Free (アイコン)",
    packageName: "@fortawesome/free-solid-svg-icons, @fortawesome/free-brands-svg-icons",
    version: "7.0.0",
    license: "CC BY 4.0 (アイコン) / MIT License (コード)",
    homepage: "https://fontawesome.com/license/free",
    text: `Font Awesome Free
Copyright Fonticons, Inc.

アイコン (SVG / フォントファイル): CC BY 4.0 License
${CC_BY_4_0_SUMMARY}

コード (JS / CSS): MIT License

${MIT("Fonticons, Inc.")}`,
  },
  {
    name: "Tailwind CSS",
    packageName: "tailwindcss",
    version: "3.4.15",
    license: "MIT License",
    homepage: "https://tailwindcss.com/",
    text: MIT("Tailwind Labs, Inc."),
  },
  {
    name: "Vite",
    packageName: "vite",
    version: "7.1.3",
    license: "MIT License",
    homepage: "https://vite.dev/",
    text: MIT("2019-present, VoidZero Inc. and Vite contributors"),
  },
];
