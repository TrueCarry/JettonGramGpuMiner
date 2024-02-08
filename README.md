# README

Сообщество - https://t.me/blckbazars

Майнер для жетона GRAM. Нужна Windows и видеокарта с драйверами CUDA или OpenCL

- Создайте `config.txt`
- Напишите мнемоник в файле `config.txt` в формате

```
SEED=word1 word2
TONAPI_TOKEN=
```

- Активируйте v4r2 кошелек. Отправьте на него средства, а потом отправьте транзакцию самому себе.
- Установите NodeJs [https://nodejs.org](https://nodejs.org/en)
- Запустите майнер открыв `start_tonhub.bat` (для AMD - `start_tonhub_amd.bat`)

## TonApi

Так же вы можете использовать TonApi(tonconsole.com) как провайдер апи. Он дает повышенную стабильность, но не работает без ключа. На 1 майнера достаточно бесплатного токена. Для запуска майнера с tonapi используйте `start_tonapi_X.bat` или `start_tonapi_X.sh`(с суффиксом \_amd для компьютеров без CUDA)

## Multi GPU

Можно запустить несколько видеокарт одним скриптом. Пример в файле `start_multi_8.sh`, `start_multi_8.bat`.
Чтобы превратить любой стартовый скрипт в мульти, надо заменить `send_universal` на `send_multigpu`
`--gpu 0` заменить на `--gpu-count X`, где Х кол-во ваших GPU
Больше ничего менять не нужно, можно запускать

# EN

Community - https://t.me/blckbazars

Miner for GRAM jetton. CUDA or OpenCL GPU needed.

- Create `config.txt`
- Enter your mnemonic `config.txt` in format

```
SEED=word1 word2
```

- Activate v4r2 wallet linked to mnemonic and send some funds there
- Install nodejs [https://nodejs.org](https://nodejs.org/en)
- Start miner by opening `start_tonhub.bat` (for AMD - `start_tonhub_amd.bat`)

# 中文

社群 - https://t.me/blckbazars

目前挖礦 GRAM 以及其他近似的 Jetton 代幣，僅支持 CUDA 或 OpenCL 的顯卡。

- 創建 `config.txt`
- 在 `config.txt` 中輸入你的助記詞，格式如下
  ```
  SEED=word1 word2
  ```
- 啟用 v4r2 錢包，並將一些資金發送到錢包中
- 安裝 NodeJs [https://nodejs.org](https://nodejs.org/en)
- 通過打開 `start_tonhub.bat` 啟動挖礦（AMD 顯卡 - `start_tonhub_amd.bat`）
