import { Earth } from './Earth'
import { Moon } from './Moon'

export function SpaceScene() {
  return (
    <>
      <Earth />
      <Moon orbitRadius={4} orbitSpeed={0.12} size={0.27} />
    </>
  )
}
