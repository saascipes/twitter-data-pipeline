import { VNode, VNodeDirective } from 'vue/types';

type ClickCallback = (event: MouseEvent) => void;
const callbacks: WeakMap<HTMLElement, any> = new WeakMap();

export default {
  bind (el: HTMLElement, binding: VNodeDirective, vnode: VNode): void {
    const onBodyClick: ClickCallback = function (event: MouseEvent): void {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value.call(vnode.context, event);
      }
    };

    callbacks.set(el, onBodyClick);
    document.body.addEventListener('click', onBodyClick);
  },

  unbind (el: HTMLElement): void {
    document.body.removeEventListener('click', callbacks.get(el));
    callbacks.delete(el);
  }
};