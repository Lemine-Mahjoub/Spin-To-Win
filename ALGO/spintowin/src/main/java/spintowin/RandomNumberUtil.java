package spintowin;
 

import java.util.Random;

public class RandomNumberUtil {
    private static final Random random = new Random();

    
    public static int generateRandomNumber() {
    	System.out.println("generation NB");
        return random.nextInt(37); // 0 inclus, 37 exclu
    }
}
