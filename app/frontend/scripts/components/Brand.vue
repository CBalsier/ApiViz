<template>

  <div class="navbar-brand" :title="brand">

      <!-- <a href="/" class="navbar-item">
        <img id="navbar-logo" :src="logo" :alt="'Logo '+ brand">
      </a> -->

      <router-link 	
        id="logo_home"
        class="navbar-item" 
        :to="logoTo">
        <img 
            id="navbar-logo" 
            :src="this.logo.url"
            :alt="'Logo ' + brand"
        ></img>
      </router-link>

      <!-- cf : https://jsfiddle.net/tbonz/80jkq0Ls/ -->
      <div 
        class="navbar-burger" 
        @click="triggerBurger()" 
        :class="{ 'is-active': showNav }"
        >
        <span></span>
        <span></span>
        <span></span>
      </div>

    </div>

</template>

<script>
export default {
  props: [
    'logo',
    'logoTo', 
    'brand'
  ],
  computed: {
    showNav() {
      return this.$store.getters.getNavbarVisibility
    }
  },
  methods : {
    triggerBurger(){
      this.$store.commit('switchNavbarMenu')
    }
  }
}
</script>
