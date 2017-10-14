import '../sass/style.scss';
import { $, $$ } from './modules/bling';
import typeAhead from './modules/typeAhead';
import ajaxLike from './modules/like';

typeAhead( $('.search') );

const likeForms = $$('form.like');
likeForms.on('submit', ajaxLike);