# BotSquad：為持續運作的 AI 組織打造的自架式控制平面

**技術白皮書**  
**版本：** 0.3
**日期：** 2026-09-29
**專案：** BotSquad  
**程式庫：** eugenelin89/bot_messenger  
**英文版：** [English Technical White Paper](WHITEPAPER.md)

> 本文為英文版技術白皮書的台灣繁體中文版。內容與章節結構忠於原文，但在措辭、語序與技術用語上，依台灣讀者的閱讀習慣做了適度轉譯，而非逐字直譯。

## 摘要

BotSquad 是一套自架式（self-hosted）控制平面，用來把持續存在的 AI 工作者組織成可觀察、受控、可稽核的團隊。

它的核心出發點很簡單：真正有用的多代理（multi-agent）系統，不能只靠幾個模型工作階段彼此交換文字。要讓一群 AI 長期協作，還需要持久的組織身分、明確的工作指派、可信任的權限邊界、可復原的執行狀態、以證據為基礎的工作交接，以及人類可以隨時介入的控制機制。

在 BotSquad 裡，AI 工作者不是一個永遠持續運轉的模型程序，而是一個持續存在的邏輯成員。沒有工作時，它可以完全休眠；只有真的有任務進入佇列時才會被喚醒。它的角色、任務歷史與組織關係會持續保留，而實際執行工作時，則透過可替換的 runtime session，例如 Codex thread，來完成一次有明確邊界的執行。

BotSquad 最初只是跑在單一工作站上的實驗，後來逐步演進成一個可以長時間運作、自行架設的 Ubuntu 總部。目前的實作已經實際驗證：一個具有上下層關係的 AI 組織，可以進行研究、同時進行軟體開發、接受獨立審查，再由可信任的整合流程完成測試與合併；同時也具備 Linux 隔離、每位工作者獨立的模型與推理強度設定、重新啟動後的狀態復原，以及僅供私人存取的 Web 介面。Prompt 04 加入每位工作者的 Unix 身分與 Nix 協調的精確核准流程，Prompt 05 則加入一般化的軟體 Project 與 repository lifecycle。

Prompt 06 進一步實作穩定、具版本的 `/api/v1/` Client API，包含持久的 HQ／device 身分、本機由人類確認的 Ed25519 配對、固定 device capability、短效 proof-of-possession session、可安全重送的 idempotent mutation，以及可重新連線的持久事件。Listener 仍維持私人存取；真實驗收透過 SSH tunnel 從獨立 reference client 連入，並通過 restart、token 到期、完整 host reboot 與裝置撤銷。原生 iOS、免手動 tunnel 的行動傳輸、relay 與遠端受保護 approval 仍屬後續工作。詳見 [Prompt 06 驗證紀錄](validation/prompt-06-remote-client-api.md) 與 [Client API v1](api/CLIENT_API_V1.md)。

產品的長期 north star 現在明確定義為 **intelligent company operating model**：持續存在的 AI 員工可以接受寬泛或具體的人類 mandate，彼此直接對話、進行 working-group deliberation、留下可追溯的決策，執行有界工作，觀察成果並依證據調整策略。因此 roadmap 會先完成直接對話、團隊 deliberation 與 strategic company operating loop，再加入更廣泛的 Computer Use、多家公司、外部身分、federation，以及延後的原生行動 client。詳見 [Intelligent Company Operating Model](product/INTELLIGENT_COMPANY_MODEL.md) 與 [Decision 016](decisions/decision_016_intelligent_company_model.md)。

整個設計始終遵循一個原則：

> Prompt 負責告訴 AI 規則；真正的權限，必須由可信任的系統來執行與限制。

---

## 1. 問題是什麼

現代 AI runtime 已經可以完成相當複雜的單一任務，但當系統裡同時存在許多長期運作的 AI 工作者時，面對的就不再只是「模型會不會做這件事」的問題，而是一整套不同層次的系統工程問題。

單純開很多個聊天視窗，無法自然回答以下問題：

- 這個目標到底由誰負責？
- 哪一位工作者有權把任務再往下委派？
- 實際被指派的內容究竟是什麼？
- 最後這個結果，是由哪一次模型執行產生的？
- 某位工作者現在是閒置、被阻塞、正在工作，還是在等人類核准？
- 系統當機前，這個任務到底有沒有已經跑過？
- 一則普通訊息會不會不小心變成權限授予？
- 某位工程師實際擁有哪個 repository、哪一條 branch？
- Reviewer 到底檢查的是哪一個 commit？
- 兩位工程師能不能安全地同時工作？
- 人類能不能在工作進行中中斷、暫停或重新排序？
- Bot 能不能自己寫一句「人類已批准」就取得權限？
- Server 重啟後，公司狀態怎麼恢復？
- 要怎麼讓整個組織持續運作，而不是只有筆電開著時才活著？

這些都是控制平面（control plane）的問題，不是文字生成的問題。

BotSquad 把這些問題本身，視為產品與系統架構的一級公民。

---

## 2. 設計主張

BotSquad 建立在幾個核心觀念上。

### 2.1 工作者不是一個模型程序

工作者是一個持續存在的組織身分。

一位工作者可以具有：

- 穩定的 ID；
- 人類可讀的名稱；
- 職稱與角色；
- 任務使命；
- 上下層回報關係；
- 能力與權限；
- 可以再委派出去的權限；
- AI profile；
- workspace 或 project 綁定；
- 目前狀態；
- 任務；
- 訊息；
- 產出物；
- 執行歷史；
- runtime thread 綁定。

就算沒有任何模型程序在執行，這位工作者仍然可以長時間保持「存在」。

### 2.2 工作必須明確

訊息與任務是兩種不同的東西。

訊息用來溝通。

任務用來指派有邊界的工作。

這個區別很重要，因為一般對話不應該因為一句話，就意外觸發昂貴或具有實際後果的執行。

### 2.3 權限不能放在 Prompt 裡

模型可以提出要求。

但模型不能靠自己寫一段文字，就擴張自己的權限。

真正的權限必須由可信任的 BotSquad 程式碼執行；未來還會進一步由作業系統與基礎設施邊界共同限制。

### 2.4 Runtime session 可以替換

Codex thread 是工作者在某個 runtime 裡的工作階段綁定，不等於工作者本身。

真正持久的組織狀態與事實，仍然由 BotSquad 保存。

### 2.5 證據比「我做完了」更重要

一句「done」的可信度，不如以下這些可以查驗的東西：

- commit；
- diff；
- 報告；
- 測試輸出；
- 不可任意竄改的 review；
- artifact；
- audit event；
- 外部系統收據或回執。

因此 BotSquad 會把產出與實際產生它的工作者、任務與 execution 綁在一起。

### 2.6 閒置中的 AI 不應浪費模型資源

是否有工作，應該由控制平面知道。

AI 工作者不需要一直呼叫模型，只為了檢查收件匣是不是空的。

---

## 3. 系統模型

高階架構如下：

~~~text
人類
  |
  v
BotSquad 控制平面
  |
  +-- 組織
  +-- 訊息
  +-- 任務
  +-- 核准
  +-- 產出物
  +-- 執行紀錄
  +-- 稽核
  +-- 專案
  +-- 政策
  |
  v
Dispatcher
  |
  v
Runtime Adapter
  |
  v
Codex App Server
~~~

目前實作使用：

- TypeScript；
- Node.js 24；
- SQLite；
- 靜態 Browser UI；
- HTTP / SSE；
- 透過 private stdio 連接 Codex App Server；
- Git 保存產品開發歷史；
- 依平台實作的工程隔離機制。

---

## 4. 組織模型

BotSquad 可以表示一個小型、有上下層關係的組織。

目前驗證過的參考組織如下：

~~~text
Human
└── Atlas — CEO
    ├── Maya — Product Manager
    ├── Turing — CTO
    │   ├── Linus — Engineer
    │   ├── Ada — Engineer
    │   └── Grace — Reviewer
    └── Scout — Researcher
~~~

組織階層可以協助定義：

- 誰有權指派誰；
- 可以委派到什麼程度；
- 問題要往哪一層升級；
- 結果要回傳給誰；
- 哪一層負責摘要資訊；
- 最後責任歸屬。

但「有階層」本身並不等於安全邊界。

每個角色實際可以做什麼，仍然由可信任的控制平面決定。

---

## 5. 執行模型

BotSquad 明確區分四個概念：

~~~text
Worker
Task
Execution
Runtime thread
~~~

### Worker

持續存在的組織身分。

### Task

明確的工作物件。

一個 Task 可以包含：

- 建立者；
- 被指派者；
- 目標；
- 驗收條件；
- 限制；
- 狀態；
- 父子或相關任務關係；
- 產出物；
- 阻塞原因。

### Execution

對某項工作的一次實際執行嘗試。

Execution 可以記錄：

- 由哪位工作者執行；
- 對應哪個任務；
- 起始與結束狀態；
- runtime 資訊；
- 實際生效的 AI profile；
- 中斷或失敗的證據。

### Runtime thread

與工作者綁定的持續型模型工作階段。

未來隨著 context window、runtime 升級或其他需求，一位工作者可以更換或輪替 thread，而不需要因此失去工作者本身的組織身分。

---

## 6. 事件驅動排程

BotSquad 只有在真的有工作時才會 dispatch 工作者。

典型流程：

~~~text
Task 進入佇列
   |
   v
Dispatcher 取得符合條件的 Task
   |
   v
建立 Execution
   |
   v
建立或恢復 Worker thread
   |
   v
執行一次有邊界的模型 turn
   |
   v
產生結果 / Task 狀態轉移
   |
   v
必要時喚醒上層 Manager
~~~

目前 scheduler 支援：

- 每位工作者 / 任務同一時間最多一個 active execution；
- 全系統同時最多兩個 active execution；
- priority 排序；
- 相同 priority 下維持穩定的 FIFO；
- 暫停新的 dispatch；
- 對支援的 active turn 明確送出 interrupt。

Priority 等級為：

~~~text
critical
high
normal
low
~~~

Priority 只能影響「符合條件的工作誰先跑」，不能繞過權限或 concurrency 限制。

---

## 7. 每位工作者的 AI Profile

Prompt 03 把 runtime 設定正式納入工作者的持久資料模型。

每位工作者可以有：

- 指定模型，或繼承 runtime / company 預設；
- 指定 reasoning effort，或繼承預設；
- execution priority；
- human lock。

可用的模型與 reasoning 選項，來自目前登入中的 Codex runtime / account。

BotSquad 不把寫死在程式裡的模型清單視為最終真相。

每一次新的 Execution 都會記錄實際生效的：

- model；
- reasoning effort；
- scheduling priority；
- runtime version / adapter。

日後即使工作者 profile 改變，也不會回頭竄改歷史 execution 的證據。

新的 Codex thread 會使用較容易辨識的名稱，例如：

~~~text
BotSquad · Atlas · CEO
BotSquad · Linus · Engineer
~~~

真正的身分判定仍然以穩定 ID 為準。

---

## 8. 受控的軟體工程流程

BotSquad 的工程流程證明，多代理協作可以產生可查驗的程式碼成果，而不只是聊天。

參考流程：

~~~text
Human
  |
  v
Atlas
  |
  v
Maya 產出規格
  |
  v
Turing 協調交付
  |
  +------> Linus
  |
  +------> Ada
  |
  v
Grace 獨立審查實際提交的內容
  |
  v
可信任的 integration 執行整體驗收測試
  |
  v
只有成功時才推進 product main
~~~

重要特性包括：

- 工程師的 ownership 明確；
- 工作者不會取得無限制的 Git shell 權限；
- submission 指向精確的 commit；
- Reviewer 讀取的是實際被提交的證據；
- Reviewer 不能偷偷修改產品；
- 可信任的 integration 才能執行整體驗收；
- conflict 或測試失敗時，不會推進主分支；
- Server 重啟後，不會重跑已完成的工作。

---

## 9. 自架式 Ubuntu 總部

BotSquad 現在的主要部署方式，是由使用者自己控制的 Ubuntu 主機。

~~~text
人類工作站
      |
      | SSH / SSH Tunnel
      v
Ubuntu HQ
      |
      +-- botsquad.service
      +-- SQLite
      +-- Dispatcher
      +-- Codex Runtime
      +-- Managed Git
      +-- Linux Confinement
      +-- Loopback Web UI
~~~

目前 production-style 的檔案配置：

~~~text
/opt/botsquad
    應用程式原始碼與 build

/var/lib/botsquad
    持久公司狀態
    artifacts
    Codex service account 狀態
~~~

BotSquad service 以非 root 身分執行。

目前 UI 綁定在：

~~~text
127.0.0.1:4310
~~~

使用者透過 SSH tunnel 存取。

Server 可以位在：

- 雲端 VPS；
- 私有 VM；
- 實體 Ubuntu 主機。

DigitalOcean 只是其中一個例子，不是 BotSquad 的依賴。

---

## 10. 可重現的 Bootstrap

BotSquad 的一個重要 onboarding 目標，是讓使用者不需要自己照著幾十個 Linux 步驟逐一手動安裝。

人類只需要提供：

~~~text
支援的 Ubuntu 主機
+
可以正常登入的 SSH alias
~~~

接著，由 repo 中版本控制的 bootstrap prompt 與 installer 自動：

- 檢查主機環境；
- 安裝或更新必要套件；
- 安裝固定版本的 Node / Codex runtime；
- 建立非 root service identity；
- 建立持久資料目錄；
- 安裝 systemd service；
- 設定 Linux confinement；
- 在適合時建立 swap；
- 執行 hardened tests；
- 啟動 service；
- 驗證 recovery；
- 提供私人 UI 的連線方式。

Bootstrap 被設計成可以重複執行，而且不會破壞已保留的公司狀態。

---

## 11. Linux 隔離

Prompt 03 為 Ubuntu 24.04 x86_64 加入 Linux engineering runner。

目前設計結合：

- bubblewrap；
- user / mount / PID / network namespaces；
- read-only product / runtime mounts；
- 隱藏 Git metadata；
- 空白 environment；
- seccomp filters；
- Node permission controls；
- systemd service restrictions；
- AppArmor user namespace admission，同時不關閉 Ubuntu 的全域保護。

Runner 採 fail-closed。

如果隔離環境失敗，不會偷偷退回 unrestricted execution。

實際 acceptance probe 已經驗證會拒絕：

- filesystem escape；
- 讀取敏感 canary；
- network access；
- 不受控的 child process；
- 對 host process 發送 signal；
- 存取 sibling allocation；
- 修改 BotSquad source；
- path / symlink escape。

目前仍有一個重要限制：

> 如果某個任意惡意程序已經取得 botsquad service UID，它與其他同 UID 程序之間，目前還沒有完整隔離。

Prompt 04 已讓受限的工作者檔案與 Git 操作使用各自的 UID。可信任的控制平面、中央 Codex runtime 與認證仍使用 service UID；此隔離機制不宣稱能抵禦該可信任帳號遭到任意控制的情境。

---

## 12. 目前的驗證證據

Prompt 03 已完成真實 Ubuntu acceptance。以下保留其歷史基準；身分、核准與停用的歷史證據請見 [Prompt 04 驗證紀錄](validation/prompt-04-linux-identity.md)，一般化專案請見 [Prompt 05 驗證紀錄](validation/prompt-05-general-projects.md)，而目前的 authenticated client/device 邊界請見 [Prompt 06 驗證紀錄](validation/prompt-06-remote-client-api.md)。下列歷史量測仍只代表原始工作負載。

驗證主機：

~~~text
Ubuntu 24.04.4 x86_64
1 vCPU
2 GB RAM
約 50 GB 磁碟
2 GiB 設定完成的 swap
~~~

Acceptance 包含：

- hardened Ubuntu 與 macOS 上 60/60 deterministic tests；
- 真實 Atlas → Scout → Atlas Ubuntu workflow；
- persistent thread resume；
- 真實 turn interruption；
- 六位工作者軟體工程流程；
- 兩個 Codex worker 同時工作；
- 精確 commit 的獨立 review；
- trusted integration；
- 8/8 integrated product tests；
- systemd restart 後不 replay 已完成工作；
- host reboot recovery；
- repeat bootstrap；
- SSH tunnel 私人 Browser UI。

真實 engineering run 約 146 秒完成，其中 Linus 與 Ada 的模型 turn 約有 24.96 秒重疊。

在這次有明確範圍的工程工作負載中：

- 沒有使用到 swap；
- host 可用記憶體始終高於約 1.42 GiB；
- 抽樣 CPU 峰值約 74%。

因此，這組規格可以被視為「已驗證的輕量使用下限」，但不能被解讀為所有大型 repository 或長時間 workload 都足夠。

---

## 13. 人類控制與 Approval

目前系統已支援：

- Pause new dispatch；
- 中斷支援的 active execution；
- 更新 worker AI profile；
- human lock；
- 可查驗的 execution history。

Prompt 04 已實作工作者身分與專案存取所需的持久、精確範圍核准。Prompt 05 另外加入非 root 的 publication 核准，綁定遠端身分、分支與精確的舊／新 SHA。一般化的受保護動作授權仍留待後續。

目前強制執行的流程是：

~~~text
Bot 要求受保護的動作
        |
        v
建立 trusted approval object
        |
        v
人類檢查
        |
        +-- Deny
        |
        +-- Approve 精確範圍
                |
                v
        一次性執行受信任操作
~~~

單純在訊息裡寫「approved」，不等於核准。

---

## 14. 每位工作者獨立的 Unix 身分邊界

Prompt 04 已為受限的本機操作實作獨立工作者身分。

目前架構：

~~~text
root
└── 狹窄的 trusted provisioner

botsquad
└── control plane

bsw-<固定 worker UUID 的雜湊>
└── 私人 home 與核准後的獨立專案 clone
~~~

Nix 是長期存在、不再向下委派的 DevOps 工作者，透過明確的 infrastructure task 工作。

Nix 本身仍然不是 root，而是透過一個功能非常有限、可信任的 provisioner，提出明確、typed 的 privileged operation。

這提供：

- 每位工作者獨立 home；
- 受限原始碼寫入與 Git 操作使用各自的 UID；
- 每位工作者獨立 project clone；
- access revocation；
- retirement lifecycle；
- 更強的 containment。

---

## 15. 一般化專案支援

Prompt 05 將 Project 與 Repository 分成獨立、持久的概念。人類建立專案說明、保護路徑、資源上限與具名 Node 測試配方；一個 Project 可以包含多個新建、bundle 匯入或透過可信任 GitHub adapter 註冊的 repository，各自保存預設分支。任意主機路徑及未受限制的 Git 功能不在支援範圍。

Maya 針對實際 repository 目標撰寫規格，Turing 指派不重疊的檔案或目錄前綴寫入範圍。Linux 工程師使用各自 Unix UID 擁有的獨立 clone，不持有外部 remote。AGENTS 與專案說明只是指引；可信任程式會依不可變的 allocation manifest 強制檢查每次原始碼及 Git 操作。

Submission 保存受限的線性 commit 範圍、實際變更路徑、驗證結果與執行來源。Grace 閱讀精確且具有雜湊的 review packet；changes_required 必須指向受影響的 allocation 與 submission，再讓原工作者以原 task/thread 進行修訂。新的 submission 延續原 head，並接受新的獨立審查。持久的整合佇列會先測試核准的 candidate，再以 fast-forward 推進 canonical 分支；失敗或過期的嘗試保留歷史。

具名配方只支援明確 Node 測試路徑，不提供一般命令或套件安裝。測試在一次性 snapshot 中執行，只有 build/ 可寫；Linux 限制 tmpfs、記憶體、CPU、時間與輸出。Repository／object 內容上限 16 MiB、bundle 4 MiB、1,000 個檔案、每個檔案 128 KiB。不支援的連結、submodule、LFS、hook 與 Git 設定一律拒絕。

遠端政策為 none、fetch_only 或 approved_push。非 root 的可信任服務處理公開 GitHub fetch，以及逐次精確核准的 publication。人類核准綁定 remote、分支、預期舊 SHA 與已整合的新 SHA，接收端會以原子方式拒絕已變動的舊 SHA。回應遺失時先比對遠端狀態，不盲目重送。選用的 publication 憑證由操作人員在服務端私下設定，不進入工作者 home、prompt 或 repository URL；沒有安全的測試目標與憑證時，不宣稱已驗證真實 GitHub authenticated push。

封存會撤銷精確的 clone 存取權，同時保留 canonical Git、clone、submission、review 與 integration 歷史。Migration 不執行檔案、網路或特權操作，保留 Prompt 01–04 身分及證據。新的相容工作者 thread 可持續重用；舊工具 schema 不相容時明確拒絕，不悄悄換掉 thread。SquadStatus 保留為歷史回歸測試。詳見 [Decision 014](decisions/decision_014_generalized_projects.md) 與 [驗證紀錄](validation/prompt-05-general-projects.md)。

---

## 16. 原生 Remote Client

Web UI 仍是私人管理介面，使用既有的 local browser/admin API。Prompt 06 已在同一個 loopback listener 上加入獨立、穩定且具認證的 `/api/v1/` 契約，並刻意把 client semantics 與 network transport 分開：

~~~text
BotSquad Core
   |
   +-- Local Browser/Admin API
   |
   +-- Client API v1
           +-- 今日的 Reference Client
           +-- 稍後的原生 iOS App
           +-- Future Clients
   |
   +-- Reconnectable Event Stream
   +-- Device Identity
   +-- Human Authorization
~~~

目前已驗證的 reference client 是透過既有 SSH tunnel 存取 `/api/v1/`。在目前階段，Browser + SSH tunnel 已足夠作為操作方式；接下來先完成 Prompt 07 的直接對話與 Prompt 08 的多工作者協作討論。原生 iOS 與免手動 tunnel 的行動傳輸暫時延後，等互動語意穩定後再實作。屆時 iOS App 仍應該是一個真正原生的 operator client，而不是 WebView，也不是把 SSH terminal 包裝成 App。

---

## 17. 安全的行動裝置遠端存取

原生行動裝置的目標，是讓使用者可以直接在 iPhone 上操作 BotSquad，而不需要每次都手動建立 SSH tunnel。

BotSquad HQ 預設仍然維持私人存取。

可能的 transport 包括：

- LAN / private network；
- 使用者自己管理的 VPN；
- SSH tunnel，作為管理與救援路徑；
- 未來的 outbound BotSquad relay。

Relay 概念：

~~~text
iPhone
   |
   v
Relay
   ^
   |
由 HQ 主動建立的 outbound connection
   |
Ubuntu HQ
~~~

Relay 是傳輸基礎設施。

它不應該變成：

- 公司資料庫；
- approval authority；
- organizational truth 的來源；
- 任意 worker credential 的持有者。

透過 relay 的端對端加密，是長期設計目標；在正式定義並經過 review 的 protocol 出現以前，不應宣稱已具備 E2EE。

---

## 18. Device Identity 與 Mobile Authorization

Prompt 06 已實作明確的裝置配對、HQ／device 身分與 `/api/v1/` 契約；真實 Ubuntu 驗收狀態請見 [Prompt 06 驗證紀錄](validation/prompt-06-remote-client-api.md)。本機 Web UI 核准一次性配對與公開金鑰指紋，裝置以 Ed25519 簽署一分鐘 challenge，換取十分鐘 opaque token。私人金鑰只留在 client；server 僅保存公開金鑰與 bearer secret 的 hash。

每個請求都檢查 human、device、token 與固定 capability。變更操作與七日 idempotency receipt 在同一 transaction 提交；SSE 以持久 cursor 重連，過期或撤銷會終止串流。完整管理 tunnel 仍屬 operator 權限；未來 device-only transport 只能轉送 `/api/v1/`。iOS、relay、APNs、遠端受保護核准與 artifact 內容下載仍未實作。詳見 [Decision 015](decisions/decision_015_remote_client_trust.md) 與 [API 契約](api/CLIENT_API_V1.md)。

~~~text
HQ Admin
   |
   v
短效 pairing record
   |
   v
iPhone 註冊 device identity
   |
   v
人類確認
   |
   v
可撤銷的 device credential
~~~

Device identity 與以下概念都不同：

- human identity；
- company；
- worker；
- runtime account；
- HQ。

任何會改變系統狀態的 mobile request，都必須具備：

- authenticated human principal；
- paired device；
- operation authorization；
- idempotency；
- audit。

受保護的 approval 也必須是精確、一次性、scope-bounded 的 approval object。

---

## 19. Computer Use

Computer Use 刻意不被設計成每位工作者的預設能力。

偏好的模型是：

~~~text
Worker
  |
  v
經過核准、隔離的 Browser / Desktop Environment
~~~

能力邊界應明確限制：

- 可使用的 App；
- 可存取的網站；
- filesystem；
- upload / download；
- network；
- runtime；
- 需要 human approval 的受保護動作。

人類自己的個人工作站應該是例外情境，而不是 autonomous worker 的預設環境。

---

## 20. Multi-Company 架構

未來，一個 BotSquad HQ 可以同時承載多家彼此獨立的公司。

~~~text
Human owner
└── BotSquad HQ
    ├── Company A
    ├── Company B
    └── Company C
~~~

Company 會成為第一級的 domain / security boundary。

即使兩家公司存在同一個 database、同一台 Server，甚至共用同一個 runtime account，其中一家公司也不應因此看到另一家的：

- 訊息；
- 任務；
- repositories；
- credentials；
- approvals；
- artifacts；
- policies。

架構上必須明確區分：

~~~text
Human owner
Runtime account
BotSquad HQ
Company
Worker
Runtime thread
Execution
Device
External identity
~~~

---

## 21. 公司對公司的合作

當公司隔離已經成立之後，才能安全地加入明確的跨公司合作。

~~~text
Company A
   |
   | Explicit Trusted Connection
   v
Company B
~~~

Connection 可以決定：

- 允許哪種 communication；
- 可以委派哪些 task type；
- artifact sharing；
- approval requirement；
- rate limit；
- lifecycle / revocation。

一家公司的 AI 可以委託另一家公司工作，但不代表因此可以直接進入對方內部組織。

---

## 22. 外部身分與 Telegram

未來工作者可以擁有選擇性的 external identity。

~~~text
Worker
  |
  +-- Internal BotSquad Identity
  |
  +-- Optional External Identities
         +-- Telegram Bot
         +-- Email
         +-- Future Providers
~~~

External identity 不等於 worker identity。

Provider credential 應該放在可信任的 BotSquad integration code 後方，不直接暴露給一般 worker。

Telegram 可以扮演：

- 行動裝置上的對話入口；
- 公司或工作者的外部身分；
- notification channel；
- 公司對公司通訊的一種 transport。

但 Telegram 不應取代 BotSquad 內部 message bus，也不是 authority layer。

---

## 23. Cross-HQ Federation

更長期來看，不同 BotSquad installation 之間可以彼此連線。

~~~text
HQ A
  |
  | Authenticated Federation
  v
HQ B
~~~

原生 federation protocol 應具備：

- authenticated peer identity；
- company identity；
- replay protection；
- deduplication；
- revocation；
- bounded loops；
- rate limiting；
- artifact integrity；
- explicit connection policy。

Federation 不應靠直接分享內部 database，也不能把 AI 自己寫的自然語言訊息當成權限來源。

---

## 24. Runtime Account 與公司必須解耦

BotSquad 不應假設：

~~~text
一個 runtime account == 一家公司
~~~

也不應假設：

~~~text
一個 runtime account == 一個 HQ
~~~

同一個人可以依 runtime provider 的規則，在不同公司或不同 HQ 上使用 runtime account。

Runtime account 的容量、限制與使用量，是 resource concern。

Company identity 與 company security，則是 BotSquad concern。

兩者必須保持分離。

---

## 25. 安全設計哲學

BotSquad 的安全模型是分層的。

### Control-plane enforcement

可信任程式碼決定：

- 誰可以指派任務；
- 誰可以 hire；
- 允許哪些 capability；
- 哪個 task 可以執行；
- 哪個 project 屬於誰；
- 是否需要 approval。

### Runtime confinement

模型 runtime 只能取得受限的工具與 context。

### Operating-system confinement

Linux / macOS 邊界限制 engineering test process 可以接觸的內容。

### Future worker identity

每位工作者獨立 Unix account，可以進一步降低 same-UID exposure。

### External integration boundary

Infrastructure credential、Telegram token、remote device secret，以及其他未來的 provider credential，都不應出現在一般 worker prompt 中。

### Human approval

具有實際後果的 protected operation，必須取得可信任的人類授權。

沒有任何一個 Prompt 本身，被視為完整的 security boundary。

---

## 26. Reliability 設計哲學

BotSquad 假設以下事情一定會發生：

- process 會 crash；
- network request 會 timeout；
- model 會失敗；
- server 會 restart；
- client 會 reconnect；
- message 可能重複送達；
- 使用者可能中斷工作。

因此：

- 狀態必須 durable；
- claim 必須 transactional；
- retry 必須 bounded；
- 有實際後果的 operation 應盡量 idempotent；
- interrupted work 應該被 inspect；
- completed work 不應盲目 replay；
- runtime session 是可復原的 binding，不是組織真相本身。

---

## 27. 為什麼 Self-Hosting 很重要

自架的核心價值，不只是「Server 在自己手上」。

真正重要的是：

> 操作者掌握 coordination plane 與 durable company state。

這並不表示所有計算都必須在本機完成。

模型 inference 可以由外部 runtime 提供。

未來 relay 或 push service 也可能協助連線。

但 canonical 的 company / task / worker / audit state，仍然由使用者自己控制的 BotSquad 控制平面保存，除非未來架構明確改變這個邊界。

---

## 28. 為什麼需要專門的控制平面

Email、聊天軟體與檔案都可以傳遞訊息，但它們不會自然提供：

- task authority；
- worker identity；
- execution state；
- concurrency control；
- approval semantics；
- retry / recovery；
- model runtime binding；
- repository ownership；
- artifact provenance；
- reviewer / integration gate。

BotSquad 把這些東西正式變成系統的一級概念。

---

## 29. Roadmap

目前 canonical roadmap 如下：

| Prompt | Milestone |
| --- | --- |
| 01 | 持續型組織基礎 |
| 02 | 受控軟體工程 |
| 03 | Ubuntu HQ |
| 04 | Nix、Approvals、每位工作者獨立 Linux Identity |
| 05 | 一般化 Project / Repository |
| 06 | Stable Authenticated Remote-Client API |
| 07 | 第一級直接對話與 Worker Interaction |
| 08 | 多工作者 Working Group 與 Deliberation |
| 09 | Strategic Company Operating Loop |
| 10 | Bounded Computer Use |
| 11 | Multi-Company Support |
| 12 | Company-to-Company Collaboration |
| 13 | External Identities 與 Telegram |
| 14 | Cross-HQ Federation |
| — | Native iOS Remote MVP／免手動 tunnel 行動傳輸 — 延後 |
| 15+ | 更廣泛的公司營運能力 |

完整 dependency 與 acceptance theme 請參考 Roadmap 文件。

---

## 30. BotSquad 現在還不是什麼

目前已驗證的系統，還沒有提供：

- 一般化 trusted approval grant；
- 任意大小的 repository、不支援的 Git 功能或一般語言／套件執行環境；
- 人類與個別 worker 的可靠直接對話／reply-wake 語意；
- 有界的多 worker working group／deliberation；
- 可接受寬泛／具體 mandate、依 outcome 調整策略的 strategic company operating loop；
- iOS client／免手動 tunnel 行動傳輸；
- Computer Use；
- multi-company runtime；
- company federation；
- Telegram integration；
- cross-HQ federation；
- autonomous spending；
- 任意 production deployment。

這些都是 roadmap 上的未來項目，不是現在已經具備的功能。

---

## 31. 長期願景

長期目標，是讓使用者可以管理一組彼此獨立治理、能持續運作的 AI 組織，同時仍然保有完整的可觀察性與人類權限邊界。

一個可能的未來拓撲：

~~~text
Human owner
   |
   +-- iPhone / Web / Desktop Clients
   |
   +-- BotSquad HQ A
   |      +-- Company A
   |      +-- Company B
   |
   +-- BotSquad HQ B
          +-- Company C

Companies
   +-- Persistent Workers
   +-- Projects
   +-- Isolated Computers
   +-- External Identities
   +-- Infrastructure
   +-- Approvals
   +-- Other Company Connections
~~~

目標不是「無限制自治」。

目標是讓能力愈來愈強的 AI 組織可以真正完成有價值的工作，同時仍然讓權限、證據、安全邊界與人類控制保持清楚可見。

---

## 32. 專案原則

1. 人類的權限必須明確。
2. 訊息不能憑空製造權限。
3. 任務必須把工作內容說清楚。
4. 閒置工作者不應消耗模型資源。
5. 持久身分必須比 runtime session 活得更久。
6. Policy 必須由可信任程式碼執行。
7. 可查驗證據比自信的文字更重要。
8. Concurrency 必須搭配清楚的 ownership。
9. Recovery 不應盲目重播具有副作用的操作。
10. Credential 必須留在可信任邊界之後。
11. 新能力預設都應該有邊界。
12. 外部連線不能在不知不覺中破壞 self-hosted 安全模型。
13. Company boundary 必須明確。
14. Mobile client 只是 client，不是另一份系統真相。
15. 能證明下一個能力的最簡單架構，通常就是當下最好的架構。

---

## 33. Repo 內相關文件

目前狀態與操作文件：

- [README](../README.md)
- [Current State](operations/CURRENT_STATE.md)
- [Access and Operations](operations/ACCESS_AND_OPERATIONS.md)
- [System Architecture](architecture/SYSTEM_ARCHITECTURE.md)
- [Project Vision](product/PROJECT_VISION.md)
- [AI Organization Model](product/AI_ORGANIZATION_MODEL.md)
- [Ubuntu HQ and Bootstrap Model](product/UBUNTU_HQ_AND_BOOTSTRAP.md)
- [Prompt 03 Ubuntu Validation](validation/prompt-03-ubuntu.md)
- [Decision Index](decisions/README.md)

未來架構文件：

- [Roadmap](product/ROADMAP.md)
- [Native iOS Remote Client and Secure Remote Access](product/IOS_REMOTE_CLIENT.md)
- [Computer Use Model](product/COMPUTER_USE_MODEL.md)
- [Multi-Company and Federation Model](product/MULTI_COMPANY_AND_FEDERATION.md)
- [External Identities and Telegram Integration](product/EXTERNAL_IDENTITIES_AND_TELEGRAM.md)

歷史驗證：

- [Prompt 01 Plan](exec-plans/prompt-01.md) / [Validation](validation/prompt-01.md)
- [Prompt 02 Plan](exec-plans/prompt-02.md) / [Validation](validation/prompt-02.md)
- [Prompt 03 Plan](exec-plans/prompt-03.md) / [Validation](validation/prompt-03-ubuntu.md)
- [SquadStatus Case Study](examples/squadstatus-case-study.md)

---

## 結語

BotSquad 把 multi-agent autonomy 看成一個「組織系統」問題，而不只是模型能力問題。

語言模型提供推理與執行能力；但一個真正能運作的 AI 組織，還需要持久身分、明確工作、權限邊界、排程、隔離、審查、證據、復原，以及人類治理。

前面三個 milestone 已經證明這個方向具備實際可行性：

- 持續存在的 AI 工作者，可以透過 durable control plane 真正協作；
- 多位 AI 工程師，可以在清楚 ownership 與獨立 review 下同時工作；
- 整個組織可以在一台小型、自架的 Ubuntu Server 上長時間運作，並且保有真實模型執行、隔離、restart recovery，以及每位工作者獨立的 AI profile。

接下來的 roadmap，不是先追求更多 client 介面，而是先把 AI 組織本身做成真正能工作的 intelligent company：Prompt 07 直接對話、Prompt 08 多工作者 deliberation、Prompt 09 strategic company operating loop，之後才逐步加入 Prompt 10 受控 Computer Use、多家公司、外部身分與 federation。Prompt 06 的 Client API 基礎已保留，原生 iOS 可在互動模型穩定後再接上。

BotSquad 最核心的架構承諾始終不變：

> 系統能力可以持續增加，但不應以犧牲可觀察性、可追溯性、可復原性，或人類權限為代價。
