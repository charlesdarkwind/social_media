import '../sass/style.scss';
import { $, $$ } from './modules/bling';
import typeAhead from './modules/typeAhead';
import ajaxLikePost from './modules/likePost';
import ajaxLikeComment from './modules/likeComment';

typeAhead( $('.search') );

const likeForms = $$('form.likePost');
likeForms.on('submit', ajaxLikePost);

const likeFormsComment = $$('form.likeComment');
likeFormsComment.on('submit', ajaxLikeComment);