export interface Setup {
  id: number
  title: string
  exampleCount: number
  coverUrl: string | null
}

export interface SetupExample {
  id: number
  setupId: number
  setupTitle: string
  imagePath: string | null
  imageUrl: string | null
  description: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface TagCount {
  tag: string
  count: number
}
