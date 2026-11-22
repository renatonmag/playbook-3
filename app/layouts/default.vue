<script setup lang="ts">
import { BookMarked, Images } from '@lucide/vue'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '~/components/ui/sidebar'
import { SIDEBAR_COOKIE_NAME } from '~/components/ui/sidebar/utils'
import logoUrl from '~/assets/images/logo-maneki-neko.svg'

const items = [
  { title: 'Image gallery', to: '/images', icon: Images },
  { title: 'Setups', to: '/setups', icon: BookMarked },
]

const route = useRoute()
const isActive = (to: string) => route.path === to || route.path.startsWith(`${to}/`)

// The provider writes this cookie when toggled; reading it here keeps SSR and client in sync.
const sidebarCookie = useCookie<boolean | string | null>(SIDEBAR_COOKIE_NAME)
const defaultOpen = String(sidebarCookie.value) !== 'false'
</script>

<template>
  <SidebarProvider :default-open="defaultOpen">
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton as-child size="lg" tooltip="playbook">
              <NuxtLink to="/setups">
                <span class="flex size-8 shrink-0 items-center justify-center">
                  <img :src="logoUrl" alt="" class="size-[1.6rem]">
                </span>

                <span class="truncate font-semibold">playbook</span>
              </NuxtLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in items" :key="item.to">
              <SidebarMenuButton as-child :is-active="isActive(item.to)" :tooltip="item.title">
                <NuxtLink :to="item.to">
                  <component :is="item.icon" />
                  <span>{{ item.title }}</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>

    <SidebarInset>
      <header class="flex h-12 shrink-0 items-center gap-2 border-b border-border px-3">
        <SidebarTrigger />
      </header>
      <slot />
    </SidebarInset>
  </SidebarProvider>
</template>
