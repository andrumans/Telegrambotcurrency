const telegramBot = require('node-telegram-bot-api');
const http = require('http');
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const bot = new telegramBot(TOKEN, { polling: true });

let selectedTable = '';

function sendTable(id, tableCode) {
    http.get(`http://api.nbp.pl/api/exchangerates/tables/${tableCode}/?format=json`, (response) => {
        let data = '';
        response.on('data', (chunk) => {
            data += chunk;
        });
        response.on('end', () => {  
            let dane = JSON.parse(data);
            let currencies = dane[0].rates.map((rate) => {
                return `${rate.currency}: ${rate.code}`;
            }).join('\n');
            bot.sendMessage(id, `Table ${tableCode}:\n${currencies}`);
        });
    }).on('error', (error) => {
        console.log(error);
    });
}

function sendCurrency(id, tableCode, currencyCode) {
    http.get(`http://api.nbp.pl/api/exchangerates/rates/${tableCode}/${currencyCode}/?format=json`, (response) => {
        let data = '';
        response.on('data', (chunk) => {
            data += chunk;
        });
        response.on('end', () => {
            let dane = JSON.parse(data);
            let kurs = dane.rates[0].mid;
            bot.sendMessage(id, `Kurs ${currencyCode} w tabeli ${tableCode}: ${kurs}`);
        });
    }).on('error', (error) => {
        console.log(error);
    });
}

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, `Witaj ${msg.from.first_name}, wybierz kod tabeli`, {
        "reply_markup": {
            "inline_keyboard": [
                [{ text: 'Tabela A', callback_data: 'A' }],
                [{ text: 'Tabela B', callback_data: 'B' }]
            ]
        }
    });
});

bot.on('callback_query', (callbackQuery) => {
    const message = callbackQuery.message;
    const tableCode = callbackQuery.data;
    selectedTable = tableCode;
    sendTable(message.chat.id, tableCode);
    bot.sendMessage(message.chat.id, `Dostępne kody walut w tabeli ${tableCode}:\nWpisz kod waluty`);
});

bot.on('message', (msg) => {
    if (msg.text === '/start') {
        return;
    } else if (selectedTable === '') {
        bot.sendMessage(msg.chat.id, `Najpierw wybierz kod tabeli.`);
    } else {
        sendCurrency(msg.chat.id, selectedTable, msg.text.toUpperCase());
        selectedTable = '';
    }
});

bot.on('polling_error', (error) => {
    console.log(error);
});
