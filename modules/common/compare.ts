
export class CompareString{

    constructor(){
    }

    protected leven(str1:string, str2:string) {
        const track = Array(str2.length + 1).fill(null).map(() =>
          Array(str1.length + 1).fill(null));
        for (let i = 0; i <= str1.length; i += 1) {
          track[0][i] = i;
        }
        for (let j = 0; j <= str2.length; j += 1) {
          track[j][0] = j;
        }
        for (let j = 1; j <= str2.length; j += 1) {
          for (let i = 1; i <= str1.length; i += 1) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
              track[j][i - 1] + 1, // deletion
              track[j - 1][i] + 1, // insertion
              track[j - 1][i - 1] + indicator, // substitution
            );
          }
        }
        return track[str2.length][str1.length];
      }

      protected similarity(str1:string, str2:string):string {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        const longerLength = longer.length;
        if (longerLength === 0) {
          return "1.0";
        }
        const distance = this.leven(longer, shorter);
        return (1.0 - distance / longerLength).toFixed(2);
      }

    public compare(str:string,arr:string[]):number {
      let accurate:number = 0;
      arr.forEach(e=>{
        const comp = Number(this.similarity(e,str))
        if(accurate < comp) accurate = comp;

      })
      return accurate;
 
    }

}