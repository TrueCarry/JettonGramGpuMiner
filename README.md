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
Так же вы можете использовать TonApi(tonconsole.com) как провайдер апи. Он дает повышенную стабильность, но не работает без ключа. На 1 майнера достаточно бесплатного токена. Для запуска майнера с tonapi используйте `start_tonapi_X.bat` или `start_tonapi_X.sh`(с суффиксом _amd для компьютеров без CUDA)

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

