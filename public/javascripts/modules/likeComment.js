import axios from 'axios';
import { $ } from './bling';

function ajaxLikeComment(e) {
  e.preventDefault();
  axios
    .post(this.action) // The action is the action field of the button, the API url
    .then(res => {
      //console.log(res)
      // This.likeComment refers to a name attribute on the element inside the form(this), here its the button itself
      const isLiked = this.likeComment.classList.toggle('like__button--liked');
      this.parentElement.previousSibling.textContent = `${res.data.comment.likesCount} points`; // Comment's likes count
      if (isLiked) {
        this.likeComment.classList.add('like__button--animate');
        setTimeout(() => this.likeComment.classList.remove('like__button--animate'), 1300);
      }
    })
    .catch(console.error);    
}

export default ajaxLikeComment;