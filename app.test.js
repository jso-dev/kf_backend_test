import { getOutages } from './app.js'

describe('going to run one of the functions in jest'), () => {
    it('getOutages', () => {
        //Arrange
        const test = getOutages()
        //Act
        console.log(test)
        //Assert
    })
}