# 東京メトロ沿線ホテル検索 (Tokyo Metro Line Hotel Search)

## 公共交通オープンデータチャレンジ2025 エントリー作品

### 概要

**「その格安ホテル、交通費と移動時間を含めても本当にお得ですか？」**

本サービスは、単なる「駅近」や「宿泊費の安さ」だけでなく、**目的地までの交通費・移動時間を含めた「トータルコスト（実質価格）」と「タイパ（時間対効果）」**でホテルを検索できるWebアプリケーションです。

東京メトロ全路線に対応し、実際の運賃・時刻表データに基づいた精度の高い比較を提供します。

### 特徴

* **実質価格（トータルコスト）での比較**
  * 宿泊費だけでなく、目的地までの往復電車運賃（IC利用/切符利用）を加算した合計金額で比較できます。
  * 「宿泊代は安いが遠くて交通費が高い」ホテルと、「少し高いが交通費が安い」ホテルの損得が一目で分かります。
* **移動情報の可視化**
  * **正確な移動時間**: 実際の列車時刻表データと、OSRMによる正確な徒歩ルート計算（直線距離ではありません）を組み合わせて算出。
  * **終電・始発チェック**: 宿泊日から逆算し、目的地からホテルへの終電時刻と、翌朝の始発時刻も自動表示します。
* **直感的なUI/UX**
  * **Neumorphism Design**: ソフトで触りたくなるような質感と、直感的な操作性を提供。
  * **Liquid Background**: Three.jsを用いた流体アニメーション背景により、高級感と先進性を演出。
  * **レスポンシブ対応**: スマートフォン（モバイル）での利用に最適化。

### 使用データ・技術

本アプリケーションは以下のオープンデータおよびAPIを利用して開発されています。

#### 1. 公共交通オープンデータセンター (ODPT)

本アプリケーションは、公共交通オープンデータセンターのデータを利用しています。

* 使用データ:
  * `odpt:Railway` (路線情報)
  * `odpt:Station` (駅情報)
  * `odpt:RailwayFare` (運賃情報：IC/切符)
  * `odpt:TrainTimetable` (列車時刻表)
  * `odpt:StationTimetable` (駅時刻表)

#### 2. Rakuten WEB Service

* **Supported by Rakuten Developers**
* 楽天トラベル施設検索API (VacantHotelSearch) を使用して、ホテルの空室情報・価格・画像・レビュー情報を取得しています。

#### 3. OpenStreetMap / OSRM

* Map data © OpenStreetMap contributors
* Routing by OSRM (Open Source Routing Machine)
* 駅からホテルまでの正確な徒歩ルート計算に使用しています。

---

### 技術スタック

* **Frontend**: React 19, TypeScript
* **Build Tool**: Vite
* **Styling**: Tailwind CSS v4, Custom CSS (Neumorphism)
* **Graphics**: Three.js (@react-three/fiber, @react-three/drei)
* **Routing Logic**: GLSL (Shaders), Custom Algorithms for timetable parsing

### セットアップと実行方法

#### 前提条件

* Node.js (v18以上推奨)
* npm

#### インストール

```bash
npm install
```

#### 環境変数の設定

ルートディレクトリに `.env.local` ファイルを作成し、以下のキーを設定してください。

```env
# 公共交通オープンデータセンター (ODPT) のAPIキー
VITE_ODPT_API_KEY=your_odpt_api_key

# 楽天ウェブサービスのアプリID
VITE_RAKUTEN_APP_ID=your_rakuten_app_id
```

#### 開発サーバーの起動

```bash
npm run dev
```

### ライセンスについて

本ソフトウェアのソースコードは MIT License ですが、利用しているデータ（ODPT, Rakuten, OSM）にはそれぞれの利用規約が適用されます。データの二次利用や商用利用については、各提供元の規約をご確認ください。
