import { Worker } from 'bullmq';
import ccxt from 'ccxt';

import { setRequiredVariable, encryptData } from './helpers';
import logger from './logger';
import axios from 'axios'



async function main () {
  logger.info("\n\n")
  logger.info(setRequiredVariable('SERVER_NAME') + ': worker: ' + 'up!')

  const worker = new Worker('tasks', async (job: any) => {
    logger.info(setRequiredVariable('SERVER_NAME') + ': worker: ' + `${job.id}: logger_key: ${job.data.login_api_apiKey_S}: email: ${encryptData(job.data.fine_exchange_user_id)}: job_data: ${encryptData(JSON.stringify(job.data))}`)
    // console.log("job>")
    // console.log(job)
    // console.log("<job")
    var url = `http://${setRequiredVariable('SERVER_DB_URL')}:${setRequiredVariable('SERVER_DB_PORT')}/get_task_by_id`
    var response: any
    try {
      response = await axios.post(url,
        {
          id: job.data.task_unique_id,
          login_api_apiKey_S: job.data.login_api_apiKey_S
        }
      )
      console.log(response.data)
      logger.info(setRequiredVariable('SERVER_NAME') + ": worker: db_task_status: response: " + job.data.login_api_apiKey_S + ": " + encryptData(JSON.stringify(response.data)))
    } catch(e: any) {
      logger.info(setRequiredVariable('SERVER_NAME') + ": addJobs: db_task_status: error: " + job.data.login_api_apiKey_S + " error: " + e.toString() + " error_stack: " + e.stack)
    }

    if (response.data.task.taskStatus != 'running') {
      return {
        login_api_apiKey_S: job.data.login_api_apiKey_S,
        continue: false,
        worker_stopped: true
      }
    }

    var obj: any = {
      urls:
      {
        api:
        {
          rest:
            job.data.api_url
        }
      }
    }

    const exchange: any = new ccxt.hollaex(obj)
    // for better make 2 workers with 2 loggins, One for 'buying' and one for 'selling'
    exchange.apiKey = job.data.api_key
    exchange.secret = job.data.api_secret

    let get_side = job.data.side
    let get_symbol = job.data.symbol.split('/') // base/quote currency
    let get_orderbook = await exchange.fetchOrderBook(job.data.symbol, 5)
    let top_bid_ask = (get_side === 'buy') ?
    get_orderbook.bids[0][0] : get_orderbook.asks[0][0]  // price of 1st from bids : asks
    let calculate_price_spread = (get_side === 'buy') ? top_bid_ask - (top_bid_ask / 100 * job.data.spread_percent) : top_bid_ask + (top_bid_ask / 100 * job.data.spread_percent)
    var get_balance = await exchange.fetchBalance()
    // (for my exchange) the percentage of amount used is quote currency, to buy/sell base but can very by the side
    let calculated_amount = (get_balance[get_symbol[0]]['free'] / 100) * job.data.amount
    if (job.data.taskRecentOrderId === '') {
      let orderId = await exchange.createOrder(
        job.data.symbol,
        job.data.type,
        get_side,
        calculated_amount,
        calculate_price_spread
      )
      // console.log("----new order----")
      // console.log(orderId)
      return {
        taskRecentOrderId: orderId.id,
        api_url: job.data.api_url,
        login_api_exchangeURL: job.data.login_api_exchangeURL,
        symbol: job.data.symbol,
        type: job.data.type,
        side: job.data.side,
        amount: job.data.amount,
        spread_percent: job.data.spread_percent,
        api_key: job.data.api_key,
        api_secret: job.data.api_secret,
        login_api_apiKey_S: job.data.login_api_apiKey_S,
        fine_exchange_user_id: job.data.fine_exchange_user_id,
        seconds_interval: job.data.seconds_interval,
        task_unique_id: job.data.task_unique_id,
        continue: job.data.continue
      }
    } else {
      let editOrder = await exchange.editOrder(
        job.data.taskRecentOrderId,
        job.data.symbol,
        job.data.type,
        get_side,
        calculated_amount,
        calculate_price_spread
      )
      // console.log("----edit order----")
      // console.log(editOrder)
      return {
        taskRecentOrderId: editOrder.id,
        api_url: job.data.api_url,
        login_api_exchangeURL: job.data.login_api_exchangeURL,
        symbol: job.data.symbol,
        type: job.data.type,
        side: job.data.side,
        amount: job.data.amount,
        spread_percent: job.data.spread_percent,
        api_key: job.data.api_key,
        api_secret: job.data.api_secret,
        login_api_apiKey_S: job.data.login_api_apiKey_S,
        fine_exchange_user_id: job.data.fine_exchange_user_id,
        seconds_interval: job.data.seconds_interval,
        task_unique_id: job.data.task_unique_id,
        continue: job.data.continue
      }
    }
  }, {
    concurrency: 1000,
    connection: {
      host: setRequiredVariable('REDIS_HOST'),
      port: setRequiredVariable('REDIS_PORT')
    }
  })

  // worker.on('resumed', () => {
  //   console.log('active!')
  // })

  worker.on('failed', (job: any, err: any) => {
    logger.info(setRequiredVariable('SERVER_NAME') + ': worker: failed: ' + `${job.id} has failed with ${err.message}`)
    console.log(err)
    console.log(`${job.id} has failed with ${err.message}`)
    var current = new Date();
    console.log(current)
  })
  
  worker.on('completed', (job: any) => {
    logger.info(setRequiredVariable('SERVER_NAME') + ': worker: ' + `${job.id} has completed`)
    console.log(`${job.id} has completed`)
  })
}
main()