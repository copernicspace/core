import { waffle } from 'hardhat'

export const loadFixture: ReturnType<typeof waffle.createFixtureLoader> = waffle.createFixtureLoader()
