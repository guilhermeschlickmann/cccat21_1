import axios from "axios";

axios.defaults.validateStatus = () => true;

test("Deve criar uma conta válida", async () => {
    const inputSignup = {
        name: "John Doe",
        email: "john.doe@gmail.com",
        document: "97456321558",
        password: "asdQWE123"
    }
    const responseSignup = await axios.post("http://localhost:3000/signup", inputSignup);
    const outputSignup = responseSignup.data;
    expect(outputSignup.accountId).toBeDefined();
});

test("Não deve criar uma conta com nome inválido", async () => {
    const inputSignup = {
        name: "John",
        email: "john.doe@gmail.com",
        document: "97456321558",
        password: "asdQWE123"
    }
    const responseSignup = await axios.post("http://localhost:3000/signup", inputSignup);
    const outputSignup = responseSignup.data;
    expect(responseSignup.status).toBe(422);
    expect(outputSignup.error).toBe("Invalid name");
});

test("Não deve criar uma conta com email inválido", async () => {
    const inputSignup = {
        name: "John Doe",
        email: "john.doe",
        document: "97456321558",
        password: "asdQWE123"
    }
    const responseSignup = await axios.post("http://localhost:3000/signup", inputSignup);
    const outputSignup = responseSignup.data;
    expect(responseSignup.status).toBe(422);
    expect(outputSignup.error).toBe("Invalid email");
});

test.each([
    "111",
    "abc",
    "7897897897"
])("Não deve criar uma conta com cpf inválido", async (document: string) => {
    const inputSignup = {
        name: "John Doe",
        email: "john.doe@gmail.com",
        document,
        password: "asdQWE123"
    }
    const responseSignup = await axios.post("http://localhost:3000/signup", inputSignup);
    const outputSignup = responseSignup.data;
    expect(responseSignup.status).toBe(422);
    expect(outputSignup.error).toBe("Invalid document");
});

test("Não deve criar uma conta com senha inválida", async () => {
    const inputSignup = {
        name: "John Doe",
        email: "john.doe@gmail.com",
        document: "97456321558",
        password: "asdQWE"
    }
    const responseSignup = await axios.post("http://localhost:3000/signup", inputSignup);
    const outputSignup = responseSignup.data;
    expect(responseSignup.status).toBe(422);
    expect(outputSignup.error).toBe("Invalid password");
});

test("Deve fazer um depósito", async () => {
    const inputSignup = {
        name: "John Doe",
        email: "john.doe@gmail.com",
        document: "97456321558",
        password: "asdQWE123"
    }
    const responseSignup = await axios.post("http://localhost:3000/signup", inputSignup);
    const outputSignup = responseSignup.data;
    const inputDeposit = {
        accountId: outputSignup.accountId,
        assetId: "BTC",
        quantity: 10
    }
    //console.error('inputDeposit: ', inputDeposit);
    await axios.post("http://localhost:3000/deposit",inputDeposit);
    const responseGetAccount = await axios.get(`http://localhost:3000/accounts/${outputSignup.accountId}`);
    const outputGetAccount = responseGetAccount.data;
    expect(outputGetAccount.assets).toHaveLength(1);
    expect(outputGetAccount.assets[0].assetId).toBe("BTC");
    expect(outputGetAccount.assets[0].quantity).toBe(10);
});

test("Deve fazer um saque", async () => {
    const inputSignup = {
        name: "John Doe",
        email: "john.doe@gmail.com",
        document: "97456321558",
        password: "asdQWE123"
    }
    const responseSignup = await axios.post("http://localhost:3000/signup", inputSignup);
    const outputSignup = responseSignup.data;
    const inputDeposit = {
        accountId: outputSignup.accountId,
        assetId: "BTC",
        quantity: 5
    }

    await axios.post("http://localhost:3000/deposit", inputDeposit);
    const inputWithDraw = {
        accountId: outputSignup.accountId,
        assetId: "BTC",
        quantity: 10
    }

    await axios.post("http://localhost:3000/withdraw",inputWithDraw);
    const responseGetAccount = await axios.get(`http://localhost:3000/accounts/${outputSignup.accountId}`);

    const outputGetAccount = responseGetAccount.data;
    expect(outputGetAccount.assets).toHaveLength(1);
    expect(outputGetAccount.assets[0].assetId).toBe("BTC");
    expect(outputGetAccount.assets[0].quantity).toBe(5);
});

test("Não deve fazer um saque sem fundos", async () => {
    const inputSignup = {
        name: "John Doe",
        email: "john.doe@gmail.com",
        document: "97456321558",
        password: "asdQWE123"
    }
    const responseSignup = await axios.post("http://localhost:3000/signup", inputSignup);
    const outputSignup = responseSignup.data;
    const inputDeposit = {
        accountId: outputSignup.accountId,
        assetId: "BTC",
        quantity: 5
    }

    await axios.post("http://localhost:3000/deposit", inputDeposit);
    const inputWithDraw = {
        accountId: outputSignup.accountId,
        assetId: "BTC",
        quantity: 10
    }

    const responseWithDraw = await axios.post("http://localhost:3000/withdraw",inputWithDraw);
    const outPutWithdraw = responseWithDraw.data;
    console.error('outPutWithdraw: ',outPutWithdraw);
    expect(outPutWithdraw.error).toBe("Insufficient funds")
});

test.only("Não deve fazer um saque sem fundos", async () => {
    const inputSignup = {
        name: "John Doe",
        email: "john.doe@gmail.com",
        document: "97456321558",
        password: "asdQWE123"
    }
    const responseSignup = await axios.post("http://localhost:3000/signup", inputSignup);
    const outputSignup = responseSignup.data;
    const inputPlaceOrder = {
        marketId: "BTC/USD",
        accountId: outputSignup.accountId,
        side: "sell",
        quantity: 1,
        price: 94000
    }
    const responsePlaceOrder = await axios.post("http://localhost:3000/place_order", inputPlaceOrder);
    const outputPlaceOrder = responsePlaceOrder.data;
    console.error('outputPlaceOrder: ', outputPlaceOrder.orderId);
    const responseGetOrder = await axios.get(`http://localhost:3000/orders/{outputPlaceOrder.orderid}`);
    const outputGetOrder = responseGetOrder.data;
    expect(outputPlaceOrder.marketId).toBe(inputPlaceOrder.marketId);
    expect(outputPlaceOrder.accountId).toBe(inputPlaceOrder.accountId);
    expect(outputPlaceOrder.side).toBe(inputPlaceOrder.side);
    expect(outputPlaceOrder.quantity).toBe(inputPlaceOrder.quantity);
    expect(outputPlaceOrder.price).toBe(inputPlaceOrder.price);
    expect(outputPlaceOrder.status).toBe("open");
    expect(outputPlaceOrder.timestamp).toBeDefined();

});