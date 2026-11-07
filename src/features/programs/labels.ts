type Language='ar'|'en';
const values:Record<string,Record<string,[string,string]>>={
 vehicle:{sedan:['سيارة سيدان','Sedan'],bus:['حافلة','Bus'],coach:['حافلة سياحية','Coach'],van:['حافلة صغيرة','Van'],car:['سيارة','Car'],train:['قطار','Train'],suv:['سيارة دفع رباعي','SUV'],minibus:['حافلة صغيرة','Minibus'],airplane:['طائرة','Aircraft'],other:['وسيلة نقل أخرى','Other transport']},
 transport:{airport_hotel:['من المطار إلى الفندق','Airport to hotel'],hotel_airport:['من الفندق إلى المطار','Hotel to airport'],hotel_hotel:['بين الفنادق','Hotel to hotel'],hotel_haram:['من الفندق إلى الحرم','Hotel to Haram'],haram_hotel:['من الحرم إلى الفندق','Haram to hotel'],ziyarat:['زيارات','Visits'],shared:['نقل مشترك','Shared transfer'],other:['خدمة نقل أخرى','Other transport'],airport_transfer:['نقل من وإلى المطار','Airport transfer'],intercity:['نقل بين المدن','Intercity transfer'],local:['نقل محلي','Local transport'],shuttle:['نقل ترددي','Shuttle'],private:['نقل خاص','Private transfer'],group:['نقل جماعي','Group transport']},
 room:{single:['غرفة مفردة','Single room'],double:['غرفة مزدوجة','Double room'],twin:['غرفة بسريرين','Twin room'],triple:['غرفة ثلاثية','Triple room'],quad:['غرفة رباعية','Quad room'],quadruple:['غرفة رباعية','Quad room'],suite:['جناح','Suite']},
 visa:{umrah:['تأشيرة عمرة','Umrah visa'],tourist:['تأشيرة سياحية','Tourist visa'],visit:['تأشيرة زيارة','Visit visa'],transit:['تأشيرة عبور','Transit visa']},
};
export function valueLabel(group:keyof typeof values,value:string|null|undefined,language:Language){return values[group]?.[value?.trim().toLowerCase()??'']?.[language==='ar'?0:1]??(language==='ar'?'غير محدد':'Unspecified');}
export type VisaStatus='included'|'excluded'|'not_applicable'|null;
export function visaState(status:VisaStatus|undefined,links:{isIncluded:boolean}[]=[]){
 if(status)return status;
 return links.length?links.some(row=>row.isIncluded)?'included':'excluded':'unspecified';
}

export function displayValue(group:keyof typeof values,value:string|null|undefined,language:Language){const text=value?.trim()??"";if(!text)return "";return values[group]?.[text.toLowerCase()]?.[language==="ar"?0:1]??(/^[a-z][a-z0-9_]*$/i.test(text)?valueLabel(group,null,language):text);}
