# Fine Exchange AOM: worker

Part of **Fine Exchange AOM**, an automated order manager for market makers that I built in 2022 as part of Fine Exchange, my crypto exchange project. The [client repository](https://github.com/VitalJeevanjot/Fine-Exchange-AMM) explains the whole system, with a diagram and the path a task takes through the services.

> **Status: ended.** The Fine Exchange project ended in 2022 and the fine.exchange domain has expired, so it's no longer mine. Read the code, but don't run it with real API keys.

Runs the jobs the queue service schedules, and places the orders.

For each job, the BullMQ worker on the `tasks` queue:

1. Asks the database service for the task, and ends the task if its status isn't `running`.
2. Reads the top five levels of the order book through CCXT.
3. Prices the order: the best bid minus the task's spread for a buy, or the best ask plus the spread for a sell.
4. Sizes it as the task's percentage of the free balance.
5. Creates the order on the first run, and edits that order on later runs, so the task keeps one order near the top of the book.
6. Returns the order id, which the queue service records with the database service before scheduling the next run.

## Environment

```
USER_NAME=
USER_PASSWORD=
DB_URL=
DB_PORT=
DB_NAME=
DB_TABLE_NAME_LOGS=
SERVER_DB_URL=           # database service
SERVER_DB_PORT=
SERVER_NAME=             # name shown in logs
REDIS_HOST=
REDIS_PORT=
ENCRYPT_KEY=             # cryptr key shared by the services
```

## The system

| Service | Repository |
| --- | --- |
| Client | [Fine-Exchange-AMM](https://github.com/VitalJeevanjot/Fine-Exchange-AMM) |
| Load balancer (the API the client calls) | [fine-ex-amm-backend-load-balancer](https://github.com/VitalJeevanjot/fine-ex-amm-backend-load-balancer) |
| Queue service | [fine-ex-amm-backend-queue-jobs-1](https://github.com/VitalJeevanjot/fine-ex-amm-backend-queue-jobs-1) |
| Worker | [fine-ex-amm-backend-worker-jobs-1](https://github.com/VitalJeevanjot/fine-ex-amm-backend-worker-jobs-1) |
| Database service | [fine-ex-amm-backend](https://github.com/VitalJeevanjot/fine-ex-amm-backend) |

## Running it

```bash
npm install
npm run dev      # nodemon on app.ts
npm run build    # compile to dist/
npm start        # node dist/app.js
```

Each service listens on port 8080. `okteto.yml` and `dockerfile` are the Okteto development environment it ran in.

Built by [Jeevanjot Singh Vital](https://jeevanjotsinghvital.com).
