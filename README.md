# Solana Raydium Sniper

Solana Raydium Sniper is a bot that fetches new token pools and executes buys using the Jito technique to optimize for faster transaction speeds and potential profits.

## GitHub Repository

[Raydium Sniper GitHub Repository](https://github.com/Rabnail-SOL/Solana-Raydium-Sniper)

## Features

- **Automated Pool Detection**: Detects new pools on Raydium and buys tokens automatically.
- **Jito Integration**: Leverages Jito block engine for rapid transaction processing.
- **Configurable Environment Variables**: Customize bot behavior using environment variables.
- **Auto-Sell Functionality**: Automatizes selling with multiple take-profit options and stop-loss settings.
- **Advanced Filters and Configuration**: Fine-tune sniping behavior using extensive filter options.

## Environment Variables

Set the following environment variables in your `.env` file:

```plaintext
PRIVATE_KEY=
RPC_ENDPOINT=https://staked.helius-rpc.com/?api-key=
RPC_WEBSOCKET_ENDPOINT=wss://mainnet.helius-rpc.com/?api-key=

### Buy Configuration
- `QUOTE_MINT`:               The mint address of the token you're using to buy (e.g., WSOL).
- `QUOTE_AMOUNT`:             The amount of token used for buying.
- `MAX_BUY_RETRIES`:          Maximum number of attempts to retry buying.

### Sell Configuration
- `AUTO_SELL`:                Enable or disable auto-sell.
- `MAX_SELL_RETRIES`:         Maximum number of retries for selling.
- `PRICE_CHECK_INTERVAL`:     Interval between price checks in milliseconds.
- `PRICE_CHECK_DURATION`:     Duration for price checks in milliseconds.
- `TAKE_PROFIT1` and `TAKE_PROFIT2`: Target profit levels.
- `SELL_AT_TP1`:              Percentage of holding to sell at the first take-profit level.
- `STOP_LOSS`:                Stop-loss percentage.
- `SELL_SLIPPAGE`:            Allowed sell slippage percentage.

### Filters
- `USE_SNIPE_LIST`:           Use a predefined list of tokens to snipe.
- `SNIPE_LIST_REFRESH_INTERVAL`: Time interval to refresh the snipe list.
- `CHECK_IF_MINT_IS_RENOUNCED`, `CHECK_IF_MINT_IS_MUTABLE`, `CHECK_IF_MINT_IS_BURNED`: Options for mint conditions.
- `CHECK_SOCIAL`:             Enable social checks.
- `LOG_LEVEL`:                Set the logging level (e.g., `info`).
- `MIN_POOL_SIZE`, `MAX_POOL_SIZE`: Limits for pool sizes eligible for sniping.

### General Settings
- `ONE_TOKEN_AT_A_TIME`:      Restriction to one token trade at a time.
- `BLOCKENGINE_URL`:          URL of the Jito block engine server.
- `COMMITMENT_LEVEL`:         Solana network commitment level (e.g., `confirmed`).
- `JITO_FEE`:                 Fee incurred per Jito transaction.
- `JITO_KEY`:                 API key for Jito transactions.

### Transaction Mode
- `JITO_MODE`:                Enable Jito transaction mode.
- `JITO_ALL`:                 Option to apply Jito to all transactions.
```
## Usage Guide

1. **Setup Environment**: Fill out your `.env` file with your private key and RPC endpoints.
2. **Run the Bot**: Execute the bot using your preferred Node.js environment.

```bash
npm install

npm run buy
```


## 👤 Author

### Discord: rabnail_15 in discord

### Twitter: [@Rabnail_SOL](https://twitter.com/Rabnail_SOL)   

### Telegram: [@Rabnail_SOL](https://t.me/Rabnail_SOL)   


You can always find me here, for help, or for other projects.
