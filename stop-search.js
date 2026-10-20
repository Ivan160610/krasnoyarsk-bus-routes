/* Shared by the stop list and the catalogue builder. No network requests. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StopSearch=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
 function normalize(value){
  return String(value||'').normalize('NFKC').toLocaleLowerCase('ru').replace(/ё/g,'е')
   .replace(/пр\s*[-.]\s*т(?=[\s.,\d]|$)/gu,'проспект')
   .replace(/(^|[^а-яa-z])(ул|пр|просп|мкрн?|микр|жк|о)(?=[\s.,\d]|$)/gu,(_,before,word)=>before+({ул:'улица',пр:'проспект',просп:'проспект',мкр:'микрорайон',мкрн:'микрорайон',микр:'микрорайон',жк:'жилой комплекс',о:'остров'}[word]))
   .replace(/[^а-яa-z0-9]+/gu,' ').trim().replace(/\s+/g,' ');
 }
 function matches(point,query){
  const words=normalize(query).split(' ').filter(Boolean);
  const names=[point.name,...(point.searchAliases||[])].map(normalize);
  return !words.length||names.some(name=>words.every(word=>name.includes(word)));
 }
 return {normalize,matches};
});
