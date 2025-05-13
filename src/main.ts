import express, { Request, Response } from "express";
import crypto, { privateDecrypt } from "crypto";
import pgp from "pg-promise";
import { validateCpf } from "./validateCpf";
import { isValidPassword } from "./validaPassword";
import { timeStamp } from "console";
const app = express();
app.use(express.json());

// const accounts: any = [];
const connection = pgp()("postgres://postgres:123456@localhost:5432/app");

export function isValidName (name: string) {
    return name.match(/[a-zA-Z] [a-zA-Z]+/);
}

export function isValidEmail (email: string) {
    return email.match(/^(.+)\@(.+)$/);
}

interface AccountData {
    accountId: string;
    name: string;
    email: string;
    document: string;
    password: string;
    assets: { assetId: string; quantity: number }[]; // ou apenas `any[]` se preferir
  }

app.post("/signup", async (req: Request, res: Response) => {
    const input = req.body;
    //console.error("erro: ", input);
    if (!isValidName(input.name)) {
        return res.status(422).json({
            error: "Invalid name"
        });
    }
    if (!isValidEmail(input.email)) {
        return res.status(422).json({
            error: "Invalid email"
        });
    }
   if (!validateCpf(input.document)) {
        return res.status(422).json({
            error: "Invalid document"
        });
    }
    if (!isValidPassword(input.password)) {
        return res.status(422).json({
            error: "Invalid password"
        });
    }
    const accountId = crypto.randomUUID();
    const account = {
        accountId,
        name: input.name,
        email: input.email,
        document: input.document,
        password: input.password
    }

    //console.error("erro: ", account);
    // accounts.push(account);
    await connection.query("insert into ccca.account (account_id, name, email, document, password) values ($1, $2, $3, $4, $5)", [account.accountId, account.name, account.email, account.document, account.password]);
    res.json({
        accountId
    });
});

app.post("/deposit", async (req: Request, res: Response) => {
    try {
      const input = req.body;
      await connection.query(
        "insert into ccca.account_asset (account_id, asset_id, quantity) values ($1, $2, $3)",
        [input.accountId, input.assetId, input.quantity]
      );
      //console.error("error deposit: ", [input.accountId, input.assetId, input.quantity]);
      res.status(201).end(); // ou res.status(204).end() se for sem conteúdo
    } catch (err) {
      console.error("Erro ao inserir no banco:", err);
      res.status(500).json({ error: "Erro interno no servidor." });
    }
  });

app.post("/withdraw", async (req: Request, res: Response) => {
    const input = req.body;
    const accountAssetData = await connection.query("select * from ccca.account_asset where account_id = $1 and asset_id = $2", [input.accountId, input.assetId] );
    let quantity = parseFloat(accountAssetData[0].quantity) - input.quantity;
   // throw accountAssetData[0];
    if(!accountAssetData || quantity < 0){
        res.status(422).json({ error: "Insufficient funds" });
    }
    await connection.query("update ccca.account_asset set quantity = $1 where account_id = $2 and asset_id = $3", [quantity, accountAssetData.accountId, accountAssetData.assetId]);
    res.end();//void, sem retorno
});

app.post("/place_order", async (req: Request, res: Response) => {
    const input = req.body;
    const order = {
        orderId: crypto.randomUUID(),
        marketId: input.marketId,
        accountId: input.accountId,
        side: input.side,
        quantity: input.quantity,
        price: input.price,
        status: 'open',
        timestamp: new Date()
    }
    //console.error('order.side: ',order.side);
    await connection.query("insert into ccca.order (order_id, market_id, account_id, side, quantity, price, status, timestamp) values ($1, $2, $3, $4, $5, $6, $7, $8)", [order.orderId, order.marketId, order.accountId, order.side, order.quantity, order.price, order.status, order.timestamp]);
    res.json({
        orderId: order.orderId
    });

});


app.get("/accounts/:accountId", async (req: Request, res: Response) => {
    const accountId = req.params.accountId;
    // const account = accounts.find((account: any) => account.accountId === accountId);

    const accountResult = await connection.query("select * from ccca.account where account_id = $1", [accountId]);
    console.error('accountResult[0].account_Id: ', accountResult);

    const accountData: AccountData = {
        accountId: accountResult[0].account_id,
        name: accountResult[0].name,
        email: accountResult[0].email,
        document: accountResult[0].document,
        password: accountResult[0].password,
        assets: []
      };
    //console.error('accountData.accountId: ', accountResult[0]);
    const accountAssetsData = await connection.query('select * from ccca.account_asset where account_id = $1', [accountId]);
    //console.error("Accounts error: ", accountAssetsData);
    if (accountAssetsData.length === 0) {
        return res.status(404).json({ error: "Account asset not found" });
    }
    console.error('accountAssetsData: ', accountAssetsData)
    for (const accountAssetData of accountAssetsData){
        accountData.assets.push({ assetId: accountAssetData.asset_id, quantity: parseFloat(accountAssetData.quantity) });
    }
    console.error("Accounts error: ", accountData);
    res.json(accountData);
});

app.listen(3000);