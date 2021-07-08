<template>
  <div class="main" style="font-family: 'Avenir', 'Nunito Sans'; color: #2c3e50; margin-left: 44px; margin-right: 12px; margin-top: 24px">
    <h1 class="title is-1">
      <div>
        Trending on Twitter
      </div>
    </h1>

    <h2 class="subtitle is-3">
      <div>
        Powered by <img src="/logo4.png" class="logo" style="width: 175px; height: 25px">
      </div>
    </h2>

    <!-- Ordered list of twitter topics -->
    <table class="table is-striped">
      <tbody class="tbody">
        <tr class="tr">
          <td class="td"><input id="newRule" class="input" type="text" v-model="newRule" placeholder="new filter"/></td>
          <td class="td"><button id="btnAddNewRule" class="button is-primary button-spaced" :disabled="isProductionEnvironment" @click="onAddNewRuleClick">Add</button></td>
        </tr>
        <tr class="tr" v-for="rule in rules" v-bind:key="rule.id">
          <td class="td">{{rule.value}}</td>
          <td class="td"><button class="button is-danger is-light button-spaced" :disabled="isProductionEnvironment" @click="onDeleteRuleClick(rule)">Delete</button></td>
        </tr>
      </tbody>
    </table>

    <table class="table is-striped">
        <tr class="tr">
          <td class="td"><button class="button" :disabled="isProductionEnvironment" @click="onResetClicked()">Reset</button></td>
          <td class="td"><button class="button" :disabled="isProductionEnvironment" @click="onStreamClicked()">Stream</button></td>
        </tr>
    </table>

    <ol class="ol" type="1">
      <li class="li" style="margin: 15px 0;" v-for="topic in orderedTopics" v-bind:key="topic.text">{{topic.text}}</li>
    </ol>

    <br>

  </div>
</template>

<script lang="ts">
import { ClickOutside } from './directive';
import { Component, Vue, Watch } from 'vue-property-decorator';
import { StoreType } from './store/types';
import { Topic } from './store/topic/types';
import { Rule } from './store/rule/types';
import { BindSelected, BindStoreModel } from './decorator';
import * as _ from 'lodash';
import axios from 'axios';


@Component({
  directives: { ClickOutside }
})
export default class App extends Vue {
  private get defaultStoreType(){
    return StoreType.TopicStore;
  }

  @BindStoreModel({ storeType: StoreType.RuleStore, selectedModelName: 'models'})
  private rules!: Rule[];

  @BindStoreModel({ storeType: StoreType.TopicStore, selectedModelName: 'models'})
  private topics!: Topic[];

  private get orderedTopics(): Topic[]{
    this.topics.sort((a: Topic, b: Topic) => {
      return parseInt(a.id) - parseInt(b.id);
    });
    return this.topics;
  }

  private get isProductionEnvironment(): boolean{
    return process.env.NODE_ENV === 'production'
  }

// **************  CONDITIONAL PATH ROUTIING - NO TWEETS, NO RUN ANALYZE TASK **************

  private newRule: string = '';

  private async onAddNewRuleClick(){
    const newRule = {
      newRule: this.newRule
    };

    const rule = await this.$store.dispatch(`${StoreType.RuleStore}/save`, newRule);
    this.newRule = null;
  }

  private async onDeleteRuleClick(deleteRule: Rule){
    await this.$store.dispatch(`${StoreType.RuleStore}/delete`, deleteRule);
  }

  private async onResetClicked(){
    while(this.topics.length > 0){
      const topic = this.topics[0];
      await this.$store.dispatch(`${StoreType.TopicStore}/delete`, topic);
    }

    await axios.post('api/v0/rule/reset', {});
  }

  private async onStreamClicked(){
    await axios.post('api/v0/stream', {});
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
  // I prefer Avenir but Nunito Sans is a decent backup font if Avenir isn't available on client machine
  @import url('https://fonts.googleapis.com/css?family=Nunito+Sans:300,400');

  #app {
    font-family: 'Avenir', 'Nunito Sans';
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
  }

  body {   font-family: 'Open Sans', 'Avenir'; }

  table {
    border-width: 0;
    margin-left: 6px;
    tr:nth-child(odd) {background: hsl(0, 0%, 98%)} // no idea why the bulma is-striped didn't work
  }

  td {
    border-width: 0 !important;
  }

  .input {
    height: 24px;
  }

  .button {
    height: 24px;
  }

  .button-spaced {
    margin-left: 8px;
  }

  .validation-error {
    margin-top: 3px;
    margin-bottom: 3px;
    padding-left: 3px;
    padding-right: 3px;
    color: $danger;
  }

</style>
