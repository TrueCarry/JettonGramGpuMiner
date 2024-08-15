# README

## Сообщество
[Telegram Community](https://t.me/blckbazars)

Майнер для жетона GRAM. Нужна Windows и видеокарта с драйверами CUDA или OpenCL.

- Создайте `config.txt`.

- Напишите мнемоник в файле `config.txt` в формате:
  
  ```
  SEED=word1 word2
  TONAPI_TOKEN=
  ```

- Активируйте v4r2 кошелек. Отправьте на него средства, а потом отправьте транзакцию самому себе.

- Установите NodeJs [Node.js](https://nodejs.org/en).

- Запустите майнер, открыв `start_tonhub.bat` (для AMD - `start_tonhub_amd.bat`).

## THINGS

Скрипты запуска things:

```
start_multi_8_things.bat - Windows, tonapi, 8 GPU, 10 000 givers
start_multi_8_things.sh - Linux, tonapi, 8 GPU, 10 000 givers
start_things_tonhub.bat - Windows, tonhub, 10 000 givers
start_things.bat - Windows, tonapi, 10 000 givers
start_things.sh - Linux, tonapi, 10 000 givers
```

Файлы, связанные с майнингом things:

```
givers_things.js
givers_things.ts
send_multigpu_things.js
send_multigpu_things.ts
send_universal_things.js
send_universal_things.ts
```

## TonApi

Так же вы можете использовать [TonApi](https://tonconsole.com) как провайдер API. Он обеспечивает повышенную стабильность, но не работает без ключа. На 1 майнера достаточно бесплатного токена. Для запуска майнера с tonapi используйте `start_tonapi_X.bat` или `start_tonapi_X.sh` (с суффиксом _amd для компьютеров без CUDA).

## Multi GPU

Можно запустить несколько видеокарт одним скриптом (на примере файлов `start_multi_8.sh` и `start_multi_8.bat`).

Чтобы изменить любой стартовый скрипт на мульти, выполните следующие шаги:

1. Замените `send_universal` на `send_multigpu`.
2. Замените `--gpu 0` на `--gpu-count X`, где X — количество ваших GPU. 

Больше ничего менять не нужно, можно запускать.

---

# EN

## Community
[Telegram Community](https://t.me/blckbazars)

Miner for GRAM jetton. CUDA or OpenCL GPU needed.

- Create `config.txt`.

- Enter your mnemonic in `config.txt` in the format:

  ```
  SEED=word1 word2
  ```

- Activate the v4r2 wallet linked to the mnemonic and send some funds there.

- Install Node.js [Node.js](https://nodejs.org/en).

- Start the miner by opening `start_tonhub.bat` (for AMD, use `start_tonhub_amd.bat`).

## THINGS

Launch scripts for things:

```
start_multi_8_things.bat - Windows, tonapi, 8 GPU, 10,000 givers
start_multi_8_things.sh - Linux, tonapi, 8 GPU, 10,000 givers
start_things_tonhub.bat - Windows, tonhub, 10,000 givers
start_things.bat - Windows, tonapi, 10,000 givers
start_things.sh - Linux, tonapi, 10,000 givers
```

Files related to mining things:

```
givers_things.js
givers_things.ts
send_multigpu_things.js
send_multigpu_things.ts
send_universal_things.js
send_universal_things.ts
```

## TonApi

You can also use [TonApi](https://tonconsole.com) as an API provider. It provides increased stability but does not work without a key. A free token is sufficient for one miner. To start the miner with tonapi, use `start_tonapi_X.bat` or `start_tonapi_X.sh` (with the _amd suffix for computers without CUDA).

## Multi GPU

You can run multiple GPUs using a single script (see `start_multi_8.sh` and `start_multi_8.bat`).

To modify any startup script to be multi-GPU, follow these steps:

1. Replace `send_universal` with `send_multigpu`.
2. Replace `--gpu 0` with `--gpu-count X`, where X is the number of your GPUs.

No other changes are needed; you can start running it.

---

# 中文

## 社群
[Telegram 社群](https://t.me/blckbazars)

目前挖礦 GRAM 以及其他近似的 Jetton 代幣，僅支持 CUDA 或 OpenCL 的顯卡。

- 創建 `config.txt`。

- 在 `config.txt` 中輸入你的助記詞，格式如下：

  ```
  SEED=word1 word2
  ```

- 啟用連結到助記詞的 v4r2 錢包，並將一些資金發送到錢包中。

- 安裝 Node.js [Node.js](https://nodejs.org/en)。

- 通過打開 `start_tonhub.bat` 啟動挖礦（AMD 顯卡使用 `start_tonhub_amd.bat`）。

## THINGS

啟動 things 的腳本：

```
start_multi_8_things.bat - Windows, tonapi, 8 GPU, 10 000 givers
start_multi_8_things.sh - Linux, tonapi, 8 GPU, 10 000 givers
start_things_tonhub.bat - Windows, tonhub, 10 000 givers
start_things.bat - Windows, tonapi, 10 000 givers
start_things.sh - Linux, tonapi, 10 000 givers
```

與挖掘 things 相關的文件：

```
givers_things.js
givers_things.ts
send_multigpu_things.js
send_multigpu_things.ts
send_universal_things.js
send_universal_things.ts
```

## TonApi

你還可以使用 [TonApi](https://tonconsole.com) 作為 API 提供者。它提供更高的穩定性，但沒有密鑰無法運行。對於一個礦工來說，一個免費的令牌就足夠了。要使用 tonapi 啟動礦工，使用 `start_tonapi_X.bat` 或 `start_tonapi_X.sh`（對於沒有 CUDA 的計算機，請使用 _amd 後綴）。

## Multi GPU

可以通過一個腳本運行多個 GPU（參考 `start_multi_8.sh` 和 `start_multi_8.bat`）。

要將任何啟動腳本修改為多 GPU，請執行以下操作：

1. 將 `send_universal` 替換為 `send_multigpu`。
2. 將 `--gpu 0` 替換為 `--gpu-count X`，其中 X 是您的 GPU 數量。

無需其他更改，可以直接啟動運行。  

---

# DE
## Gemeinschaft

[Telegram Community](https://t.me/blckbazars)

Miner für den GRAM-Token. Es wird Windows und eine GPU mit CUDA- oder OpenCL-Treibern benötigt.

- Erstellen Sie `config.txt`.

- Schreiben Sie Ihre Mnemonik in die Datei `config.txt` im folgenden Format:

  ```
  SEED=word1 word2
  TONAPI_TOKEN=
  ```

- Aktivieren Sie die v4r2-Wallet. Senden Sie Mittel darauf und übertragen Sie dann eine Transaktion an sich selbst.

- Installieren Sie Node.js [Node.js](https://nodejs.org/en).

- Starten Sie den Miner, indem Sie `start_tonhub.bat` öffnen (für AMD verwenden Sie `start_tonhub_amd.bat`).

## DINGE

Startskripte für Dinge:

```
start_multi_8_things.bat - Windows, tonapi, 8 GPU, 10.000 Giver
start_multi_8_things.sh - Linux, tonapi, 8 GPU, 10.000 Giver
start_things_tonhub.bat - Windows, tonhub, 10.000 Giver
start_things.bat - Windows, tonapi, 10.000 Giver
start_things.sh - Linux, tonapi, 10.000 Giver
```

Dateien, die mit dem Mining von Dingen verbunden sind:

```
givers_things.js
givers_things.ts
send_multigpu_things.js
send_multigpu_things.ts
send_universal_things.js
send_universal_things.ts
```

## TonApi

Sie können auch [TonApi](https://tonconsole.com) als API-Anbieter verwenden. Es bietet eine höhere Stabilität, funktioniert jedoch nicht ohne Schlüssel. Ein kostenloses Token reicht für einen Miner. Um den Miner mit tonapi zu starten, verwenden Sie `start_tonapi_X.bat` oder `start_tonapi_X.sh` (mit dem Suffix _amd für Computer ohne CUDA).

## Multi GPU

Sie können mehrere GPUs mit einem einzigen Script ausführen (siehe `start_multi_8.sh` und `start_multi_8.bat`).

Um jedes Startskript für Multi-GPU zu ändern, befolgen Sie diese Schritte:

1. Ersetzen Sie `send_universal` durch `send_multigpu`.

2. Ersetzen Sie `--gpu 0` durch `--gpu-count X`, wobei X die Anzahl Ihrer GPUs ist.

Keine weiteren Änderungen erforderlich; Sie können es sofort ausführen.

---
# ES
## Comunidad

[Comunidad de Telegram](https://t.me/blckbazars)

Miner para el token GRAM. Se necesita Windows y una tarjeta gráfica con controladores CUDA o OpenCL.

- Crea `config.txt`.

- Escribe el mnemotécnico en el archivo `config.txt` en el siguiente formato:

  ```
  SEED=word1 word2
  TONAPI_TOKEN=
  ```

- Activa la cartera v4r2. Envíale fondos, luego envía una transacción a ti mismo.

- Instala NodeJs [Node.js](https://nodejs.org/en).

- Inicia el minero abriendo `start_tonhub.bat` (para AMD - `start_tonhub_amd.bat`).

## COSAS

Scripts para iniciar cosas:

```
start_multi_8_things.bat - Windows, tonapi, 8 GPU, 10 000 dadores
start_multi_8_things.sh - Linux, tonapi, 8 GPU, 10 000 dadores
start_things_tonhub.bat - Windows, tonhub, 10 000 dadores
start_things.bat - Windows, tonapi, 10 000 dadores
start_things.sh - Linux, tonapi, 10 000 dadores
```

Archivos relacionados con la minería de cosas:

```
givers_things.js
givers_things.ts
send_multigpu_things.js
send_multigpu_things.ts
send_universal_things.js
send_universal_things.ts
```

## TonApi

También puedes usar [TonApi](https://tonconsole.com) como proveedor de API. Proporciona una mayor estabilidad, pero no funciona sin una clave. Para un minero, es suficiente con un token gratuito. Para iniciar el minero con tonapi usa `start_tonapi_X.bat` o `start_tonapi_X.sh` (con el sufijo _amd para computadoras sin CUDA).

## Multi GPU

Se pueden ejecutar varias tarjetas gráficas con un solo script (como en los archivos `start_multi_8.sh` y `start_multi_8.bat`).

Para modificar cualquier script de inicio a multigpu, sigue estos pasos:

1. Reemplaza `send_universal` por `send_multigpu`.
2. Reemplaza `--gpu 0` por `--gpu-count X`, donde X es el número de tus GPUs. 

No es necesario cambiar nada más, se puede iniciar.

---

# KO
## 커뮤니티

[텔레그램 커뮤니티](https://t.me/blckbazars)

GRAM 토큰용 마이너. Windows가 필요하고 CUDA 또는 OpenCL 드라이버가 설치된 그래픽 카드가 필요합니다.

- `config.txt`을 만드세요.

- `config.txt` 파일에 다음 형식으로 니모닉을 입력하세요:

  ```
  SEED=word1 word2
  TONAPI_TOKEN=
  ```

- v4r2 지갑을 활성화하세요. 여기에 자금을 보내고, 그 후에 자신에게 거래를 보내세요.

- NodeJs를 설치하세요 [Node.js](https://nodejs.org/en).

- `start_tonhub.bat`를 열어 마이너를 시작하세요 (AMD의 경우 `start_tonhub_amd.bat`).

## 물건들

물건들을 시작하는 스크립트:

```
start_multi_8_things.bat - Windows, tonapi, 8 GPU, 10,000 기부자
start_multi_8_things.sh - Linux, tonapi, 8 GPU, 10,000 기부자
start_things_tonhub.bat - Windows, tonhub, 10,000 기부자
start_things.bat - Windows, tonapi, 10,000 기부자
start_things.sh - Linux, tonapi, 10,000 기부자
```

물건들 마이닝 관련 파일:

```
givers_things.js
givers_things.ts
send_multigpu_things.js
send_multigpu_things.ts
send_universal_things.js
send_universal_things.ts
```

## TonApi

또한 [TonApi](https://tonconsole.com)를 API 공급자로 사용할 수 있습니다. 이는 더 높은 안정성을 제공하지만 키 없이는 작동하지 않습니다. 하나의 마이너에 충분한 무료 토큰이 있습니다. tonapi로 마이너를 시작하려면 `start_tonapi_X.bat` 또는 `start_tonapi_X.sh`를 사용하세요 (_amd 접미사는 CUDA가 없는 컴퓨터용).

## 다중 GPU

하나의 스크립트로 여러 그래픽 카드를 실행할 수 있습니다 (예: `start_multi_8.sh` 및 `start_multi_8.bat` 파일).

멀티로 시작 스크립트를 수정하려면 다음 단계를 따르세요:

1. `send_universal`을 `send_multigpu`로 바꾸세요.
2. `--gpu 0`을 `--gpu-count X`로 바꾸세요, 여기서 X는 GPU의 수입니다.

더 이상 변경할 필요 없이 시작할 수 있습니다.
