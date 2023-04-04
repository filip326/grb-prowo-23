function id () {

    let time = Math.floor(new Date().getTime())

    let randomNumber = Math.floor(Math.random() * 999);

    time -= 1680307200 // 	Sat Apr 01 2023 00:00:00 GMT+0000
                       //   Fri Mar 31 2023 17:00:00 GMT-0700

    return time * 1000+ randomNumber;


}

export default id;

console.log(id());