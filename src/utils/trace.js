import { tap } from 'ramda';

export default label => tap(data => console.log(label, data));
