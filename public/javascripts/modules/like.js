import axios from 'axios';
import { $ } from './bling';

function ajaxLike(e) {
  e.preventDefault();
  axios
    .post(this.action) // The action is the action field of the button, the API url
    .then(res => {
      // console.log(res)
      // This.like refers to a name attribute on the element inside the form(this), here its the button itself
      const isLiked = this.like.classList.toggle('like__button--liked');
      $('.like-count').textContent = res.data.user.likes.length; // User's likes count
      this.parentElement.previousSibling.textContent = res.data.post.likesCount; // Post's likes count
      if (isLiked) {
        this.like.classList.add('like__button--animate');
        setTimeout(() => this.like.classList.remove('like__button--animate'), 1300);
      }
    })
    .catch(console.error);    
}

export default ajaxLike;