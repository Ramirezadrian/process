const random = (min, max) => {
    return Math.floor((Math.random() * (max - min + 1)) + min)
}


const getNumbers = (cant) =>{
    const numeros = []
    for(let i =0; i < cant; i++){
        numeros.push(random(1,1000))
    }
    return numeros
}
process.on('message', cant => {
    const nums = getNumbers(cant)
    process.send(nums)
})
