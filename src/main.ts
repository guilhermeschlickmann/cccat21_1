import express, { Request, Response } from "express";
import crypto from "crypto";
import pgp from "pg-promise";
import { validateCpf } from "./validateCpf";
import { isValidPassword } from "./validaPassword";

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

app.post("/signup", async (req: Request, res: Response) => {
    const input = req.body;
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
    // accounts.push(account);
    await connection.query("insert into ccca.account (account_id, name, email, document, password) values ($1, $2, $3, $4, $5)", [account.accountId, account.name, account.email, account.document, account.password]);
    res.json({
        accountId
    });
});

app.post("/deposit", async (req: Request, res: Response) => {
    const input = req.body;
    await connection.query("insert into ccca.account_asset (account_id, asset_id, quantity) values ($1, $2, $3)", [input.accountId, input.assetId, input.quantity]);
    res.end();//void, sem retorno
});

app.post("/withdraw", async (req: Request, res: Response) => {
    const input = req.body;
    const [accountAssetData] = await connection.query("select * from ccaa.account_asset where account_id = $1 and asset_id = $2", [input.accountId, input.assetId] );
    //if(!accountAssetData){
        //return res.status(422).json({ error: "Account has not funds for assets" });
    //}
    let quantity = parseFloat(accountAssetData.quantity) - input.quantity;
    //if(quantity < 0){
        //return res.status(422).json({ error: "Account has not funds for assets" });
    //}
    await connection.query("update ccaa.account_asset set quantity = $1 where account_id = $2 and asset_id = $3", [quantity, accountAssetData.accountId, accountAssetData.assetId]);
    res.end();//void, sem retorno
});



app.get("/accounts/:accountId", async (req: Request, res: Response) => {
    const accountId = req.params.accountId;
    // const account = accounts.find((account: any) => account.accountId === accountId);
    const accountData = await connection.query("select * from ccca.account where account_id = $1", [accountId]);
    console.log("Resultado:", accountData.accountId);

    const accountAssetsData = await connection.query('select * from ccca.account_asset where account_id = $1', [accountData.accountId]);
    accountData.assets = [];
    for (const accountAssetData of accountAssetsData){
        accountData.assets.push({ assetId: accountAssetData.assetId, quantity: parseFloat(accountAssetData.quantity) });
    }
    res.json(accountData);
});

app.listen(3000);