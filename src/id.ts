function id(): string {

    let time = Math.floor(new Date().getTime())

    let randomNumber = Math.floor(Math.random() * (1_0_000_000 - 1));

    time -= 1680307200000 // 	Sat Apr 01 2023 00:00:00 GMT+0000
                          //   Fri Mar 31 2023 17:00:00 GMT-0700
    return Buffer.from((time * 1_0_000_000 + randomNumber).toString()).toString('base64').replace('=', '');
}

export default id;

console.log(id());