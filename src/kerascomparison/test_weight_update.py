from keras.models import Sequential
from keras.layers import Dense, Activation
from keras import optimizers
import numpy as np
import keras 
init = keras.initializers.RandomUniform(minval=-0.05, maxval=0.05, seed=None)
model = Sequential()
model.add(Dense(45, input_dim = 7, activation="tanh", kernel_initializer=init, bias_initializer=init))
model.add(Dense(6, activation="linear", kernel_initializer=init, bias_initializer=init))

sgd = optimizers.SGD(lr=0.01)
model.compile(loss="mean_squared_error", optimizer=sgd)

weights = [np.array([[  2.35241987e-02,   1.67233832e-02,  -2.88175941e-02,
          1.12838261e-02,   2.90105231e-02,  -2.75806915e-02,
         -2.00766679e-02,   3.68373878e-02,   1.04501843e-02,
         -1.79812685e-02,  -3.55692506e-02,  -4.33763117e-03,
          4.70285490e-03,   2.38636844e-02,  -4.52650301e-02,
         -1.60519369e-02,   6.63796812e-03,  -2.40160711e-02,
         -4.40820232e-02,  -4.58840728e-02,  -4.89701293e-02,
         -2.76040193e-02,  -4.00739312e-02,   4.09219377e-02,
         -2.83312201e-02,  -2.02629101e-02,  -5.02170250e-03,
         -1.91353261e-04,  -3.35439220e-02,  -3.19952518e-02,
         -1.90532096e-02,   4.27685715e-02,   4.89135869e-02,
          3.51745747e-02,   2.10163705e-02,   1.26544125e-02,
         -7.49855116e-03,   2.33445875e-02,   7.79653713e-03,
          4.65224274e-02,   2.85293199e-02,   5.42024523e-03,
         -4.30839770e-02,   2.89539956e-02,  -2.24209316e-02],
       [ -3.21599022e-02,  -1.23198628e-02,   2.07521059e-02,
         -2.75547747e-02,  -2.71736141e-02,   2.65911706e-02,
         -5.63215464e-04,   1.96641125e-02,   3.14363725e-02,
         -4.01259661e-02,  -1.59994476e-02,  -4.31917906e-02,
          9.29505751e-03,   1.74823441e-02,   4.85670008e-02,
         -3.72931138e-02,  -3.90007123e-02,  -7.66222551e-03,
          1.05568282e-02,  -4.76417802e-02,  -2.32160091e-02,
         -2.99236178e-02,  -4.27285805e-02,   4.56870310e-02,
          3.53202112e-02,  -1.14328973e-02,   3.32933702e-02,
         -1.94380879e-02,  -1.18736140e-02,   2.70711891e-02,
          2.34502070e-02,  -3.86670604e-02,  -3.97770889e-02,
          1.45342238e-02,  -1.76333413e-02,  -3.62929590e-02,
          4.09996398e-02,   4.98874113e-03,   1.19239688e-02,
          4.63511832e-02,   4.06189002e-02,   3.80876921e-02,
         -2.05847267e-02,   1.66545175e-02,  -3.06647550e-02],
       [ -2.32422706e-02,   2.83977725e-02,  -5.28818369e-03,
         -2.37424616e-02,   5.74551523e-04,   2.44629644e-02,
         -2.53219735e-02,  -5.78433275e-03,   9.70969349e-03,
          5.00664860e-03,   2.92306058e-02,   4.48408239e-02,
         -3.88733260e-02,  -2.77126916e-02,  -5.81929833e-03,
          9.24569368e-03,   3.29979323e-02,  -4.37895656e-02,
         -2.36662272e-02,  -3.96260135e-02,  -3.13995034e-02,
          4.69710566e-02,   1.61745660e-02,   6.77777454e-03,
          3.02739032e-02,  -2.05638409e-02,   3.69928032e-03,
          7.10267946e-03,   1.13528743e-02,   1.73408501e-02,
          4.80004288e-02,   8.72806460e-03,  -4.33274619e-02,
         -5.89840487e-03,  -1.48118362e-02,   1.78998709e-03,
         -1.28072388e-02,  -1.09636895e-02,  -1.46716349e-02,
          7.37011433e-03,  -1.04346983e-02,   4.56983112e-02,
          1.49113648e-02,   1.49743222e-02,  -4.82031219e-02],
       [ -2.26705074e-02,  -1.02050230e-03,  -5.30526787e-03,
         -1.56424642e-02,  -2.69699823e-02,   1.66130103e-02,
         -2.45928522e-02,   1.10865012e-02,  -4.75925207e-03,
         -1.64567828e-02,  -1.99828390e-02,  -1.49416216e-02,
          3.59451808e-02,  -2.82274242e-02,   8.34631920e-03,
          9.31172445e-03,  -7.66988844e-03,  -6.43814728e-03,
          8.71761888e-03,   4.55286764e-02,   4.83341143e-03,
         -4.29560654e-02,  -4.31870297e-03,  -2.36835014e-02,
         -2.09339987e-02,   1.91689655e-03,  -3.56475115e-02,
          1.79867633e-02,   1.55565254e-02,  -2.37936731e-02,
          4.86400016e-02,   2.69246213e-02,  -3.59971039e-02,
          1.73426792e-03,   4.41666581e-02,   1.71826221e-02,
          8.31576437e-03,  -1.63977221e-03,   3.59358825e-02,
         -3.51186022e-02,  -4.06008363e-02,  -1.78205967e-02,
          3.27178948e-02,   7.68164545e-03,  -4.51098196e-02],
       [  1.79675967e-03,   2.03456990e-02,  -4.09875065e-03,
          4.53092158e-04,  -9.08342749e-03,   1.86387934e-02,
          3.95486690e-02,   9.78036970e-03,   2.66231559e-02,
          7.49894232e-03,  -4.94873896e-02,   4.73581217e-02,
          2.93504111e-02,  -2.41211541e-02,  -1.23518221e-02,
         -2.90876757e-02,  -1.27302893e-02,  -4.64932099e-02,
          4.17656191e-02,  -3.94832119e-02,   3.25125195e-02,
         -1.68684870e-03,  -2.57229805e-02,  -2.67740022e-02,
         -3.94465104e-02,  -8.17676634e-03,   4.68716025e-05,
         -3.20729837e-02,   1.68044008e-02,  -2.95453798e-02,
         -4.05861512e-02,  -1.76027417e-02,   4.25768010e-02,
         -2.89996266e-02,   1.87557600e-02,   2.67050974e-02,
         -3.38769183e-02,   2.27452777e-02,   4.50707935e-02,
          8.35250691e-03,   1.26875527e-02,  -8.55599716e-03,
          4.80759479e-02,   1.51476897e-02,  -3.96407470e-02],
       [  3.76776606e-03,  -3.73562425e-03,   4.38417830e-02,
         -2.41655950e-02,   3.51086892e-02,  -2.19684001e-02,
          4.48721088e-02,  -4.31497693e-02,  -1.25261061e-02,
          4.04233001e-02,  -2.05904376e-02,  -1.63965225e-02,
          1.85972936e-02,   3.72977518e-02,  -3.59094627e-02,
          1.33123435e-02,  -3.09110768e-02,   7.56170601e-03,
         -6.70887157e-03,  -1.77887678e-02,   3.30923460e-02,
         -2.55352389e-02,  -4.80566621e-02,  -1.77509300e-02,
          7.74197653e-03,   1.38860010e-02,  -3.18049267e-03,
          4.97798361e-02,  -2.94620637e-02,   1.96197666e-02,
         -1.65906772e-02,   2.53566839e-02,   2.83035077e-02,
          3.86162885e-02,   6.76227733e-03,   1.35556944e-02,
          1.14421248e-02,   6.67012855e-03,   1.71715356e-02,
         -2.43373048e-02,  -2.58198138e-02,  -1.62728652e-02,
          4.62300889e-02,  -2.37317812e-02,   1.58147924e-02],
       [ -2.66427882e-02,   1.15892068e-02,   2.99916603e-02,
          4.10156511e-02,   1.17387772e-02,   1.24382153e-02,
          2.00313963e-02,  -2.22100858e-02,  -1.93433892e-02,
         -4.50661667e-02,  -3.54905054e-03,  -3.52303274e-02,
         -1.06218345e-02,   2.70278715e-02,  -3.63286622e-02,
          3.60742249e-02,  -8.70395824e-03,  -1.57340281e-02,
          3.52734365e-02,   2.32273452e-02,  -1.68965682e-02,
         -4.82302085e-02,   2.28190683e-02,  -3.61694694e-02,
         -4.97670434e-02,   4.57889959e-03,   3.06959487e-02,
          4.15061824e-02,   4.22515720e-03,  -3.89612541e-02,
         -2.15082057e-02,  -1.48013346e-02,   6.26749918e-03,
          7.33131170e-03,   1.19720101e-02,   2.41758861e-02,
          4.46694531e-02,   1.22000352e-02,   1.87902339e-02,
         -2.80018579e-02,   4.43641655e-02,   2.41327621e-02,
         -3.13678533e-02,   4.75101210e-02,  -8.94214958e-03]], dtype="float32"), np.array([ 0.01016676, -0.02533391, -0.00018292,  0.01922557, -0.00475689,
        0.01223344, -0.02455973, -0.00935588, -0.02273139, -0.01547233,
        0.02768851,  0.02387054, -0.00227276, -0.00414268,  0.04090795,
       -0.02244288, -0.04684637, -0.01419614,  0.01033251,  0.03489185,
       -0.0039802 ,  0.02201916, -0.00180607, -0.03631023,  0.0210722 ,
       -0.02216731, -0.02773639, -0.00764301,  0.03170229,  0.03133499,
        0.02098776, -0.0347252 , -0.00157287, -0.03187321,  0.00282515,
       -0.02332896,  0.00495087,  0.01256272, -0.0078842 ,  0.00030528,
       -0.01737386, -0.04889631, -0.00479716, -0.04536879,  0.01844137], dtype="float32"), np.array([[ -2.53902748e-03,   1.36355869e-02,  -4.84344475e-02,
          4.69296314e-02,  -3.34000476e-02,   3.78231890e-02],
       [  3.27694677e-02,   2.83365734e-02,  -4.10703197e-02,
          4.76653092e-02,   3.54626030e-03,   3.07891630e-02],
       [ -2.43789088e-02,   3.63913663e-02,  -1.40802749e-02,
          1.49583109e-02,  -4.77064848e-02,  -3.02228816e-02],
       [  4.57660109e-03,   1.54160336e-03,  -2.44401451e-02,
          4.41248156e-02,  -4.61610332e-02,  -4.19309363e-02],
       [  3.45122330e-02,   2.67495252e-02,  -4.81424928e-02,
         -2.16483120e-02,  -4.57352400e-03,   3.99101637e-02],
       [ -1.78104527e-02,   3.43745947e-03,  -4.36667465e-02,
          1.45154037e-02,   8.86785984e-03,   2.04189457e-02],
       [  4.87993993e-02,   4.89898808e-02,   3.47873606e-02,
         -4.11453359e-02,   1.47178508e-02,  -2.93303970e-02],
       [ -3.26991454e-02,   3.50674428e-02,  -1.37111060e-02,
         -3.67927775e-02,  -2.57849228e-02,   3.60421874e-02],
       [  1.45585276e-02,   2.92089842e-02,  -4.26538363e-02,
          2.64684074e-02,   1.92182772e-02,   1.09815113e-02],
       [  1.06347203e-02,  -2.86894795e-02,  -2.98721194e-02,
         -3.76553051e-02,   1.77677982e-02,  -1.27419084e-03],
       [ -4.64291833e-02,   7.35645369e-03,   1.94974281e-02,
          1.74943469e-02,  -2.37679835e-02,   4.51045968e-02],
       [  3.90366204e-02,   4.15045135e-02,   3.55867408e-02,
         -4.73620668e-02,  -4.56312075e-02,   3.96213271e-02],
       [ -3.46385315e-03,   7.88326189e-03,  -1.86361670e-02,
         -4.09687534e-02,  -1.14038587e-02,   1.21359900e-03],
       [ -3.43522578e-02,  -2.30222233e-02,   2.37895139e-02,
          1.16935372e-02,   3.79610173e-02,   2.30512768e-03],
       [ -2.28305347e-02,   3.85461785e-02,  -3.59514356e-02,
         -6.55613840e-04,   2.06538700e-02,  -2.55133510e-02],
       [  2.51572840e-02,   4.90073115e-03,  -2.32451037e-03,
         -1.57582164e-02,  -2.19559669e-03,  -1.80775039e-02],
       [  1.21944025e-03,   1.75652243e-02,  -9.56271961e-03,
         -1.30095854e-02,  -1.30674839e-02,   3.43560688e-02],
       [  4.12813462e-02,  -3.46077904e-02,  -9.17651504e-03,
         -2.50633489e-02,  -4.15060148e-02,   3.16122063e-02],
       [  4.59802635e-02,   3.18065286e-05,  -1.71328783e-02,
         -1.27389058e-02,  -8.41872767e-03,   4.34287228e-02],
       [  2.85386704e-02,  -3.28852534e-02,  -1.85978413e-02,
          4.81681861e-02,   5.22459671e-03,  -2.38600727e-02],
       [ -1.36289224e-02,  -3.77442949e-02,   3.33296321e-02,
          3.12500075e-03,   1.74223259e-03,   1.04360692e-02],
       [ -2.75925156e-02,  -3.29007506e-02,   8.83129984e-03,
          1.13790259e-02,  -3.76628861e-02,   2.83192843e-04],
       [ -3.39176059e-02,   3.28610204e-02,   2.86391117e-02,
          3.24073471e-02,  -3.20383795e-02,  -7.16186687e-03],
       [ -3.69389541e-02,   5.31481579e-03,  -1.71970017e-02,
          3.85446884e-02,  -2.23496556e-02,  -3.33574899e-02],
       [  4.05507796e-02,  -2.79285200e-02,   2.08264031e-02,
          1.96161307e-02,  -1.46129951e-02,   2.97658183e-02],
       [ -2.05807760e-03,   4.91568781e-02,  -3.75779495e-02,
          3.26669924e-02,   1.49814002e-02,   5.53302839e-03],
       [  5.51388413e-03,  -3.22668105e-02,   3.44480015e-02,
         -3.47877741e-02,  -3.07594612e-03,  -4.57247980e-02],
       [  4.71055619e-02,  -1.11079589e-02,  -1.01211183e-02,
         -1.87850948e-02,  -4.18166406e-02,  -2.07885150e-02],
       [  1.04796179e-02,  -4.08273824e-02,   4.55821864e-02,
          3.37680429e-03,  -4.36382778e-02,  -4.54658754e-02],
       [  4.38958146e-02,  -2.25762017e-02,  -4.56011184e-02,
          3.35057639e-02,  -4.88409884e-02,  -1.35812648e-02],
       [ -8.80866125e-03,  -1.56186931e-02,  -1.94572099e-02,
         -2.89646033e-02,   2.72054411e-02,  -3.60656902e-03],
       [  3.43871377e-02,   6.63070753e-03,   3.45185660e-02,
          2.20670588e-02,  -3.43184844e-02,  -1.30821951e-02],
       [ -1.42719150e-02,   1.30567811e-02,  -1.55639648e-03,
         -1.84862986e-02,   4.76194359e-02,   3.47715132e-02],
       [  2.29493640e-02,   1.58917196e-02,  -2.53889691e-02,
         -2.46766564e-02,   2.35328563e-02,  -3.42818499e-02],
       [  3.20950486e-02,  -4.45102118e-02,   1.47995614e-02,
         -1.97317004e-02,   1.03271119e-02,   1.92040466e-02],
       [  4.91405837e-02,  -4.48228009e-02,   4.81256731e-02,
         -5.71227074e-03,  -4.46034931e-02,   6.88444450e-03],
       [  1.59298666e-02,   2.75090225e-02,  -1.96547043e-02,
         -4.63554636e-02,   3.71826813e-03,  -3.97058353e-02],
       [  3.47198583e-02,  -9.86910984e-03,  -9.58186388e-03,
          2.49166153e-02,  -1.67897232e-02,  -3.78691927e-02],
       [ -8.34531710e-03,   3.51908915e-02,   1.06546506e-02,
          3.68572362e-02,  -3.66647355e-02,  -2.48844754e-02],
       [  4.80817594e-02,   2.17774995e-02,  -4.75745574e-02,
         -1.73843727e-02,  -2.87051443e-02,   2.50780098e-02],
       [ -6.72234222e-03,   8.94849375e-03,   3.99843715e-02,
          4.03967761e-02,  -1.95492059e-04,  -4.50312868e-02],
       [ -9.93943214e-03,   7.42434338e-03,   2.14480795e-02,
          1.75398700e-02,  -3.18624824e-03,  -7.41923973e-03],
       [ -3.77174839e-02,  -2.20533144e-02,  -2.84193754e-02,
         -1.87784918e-02,   3.95277180e-02,   2.49152817e-02],
       [ -3.58744860e-02,  -3.44225541e-02,   4.44929712e-02,
         -2.23453771e-02,   3.94126028e-03,  -3.23783532e-02],
       [ -4.34174053e-02,  -2.12069638e-02,  -2.16777325e-02,
          3.64741422e-02,   1.56294145e-02,  -1.06322654e-02]], dtype="float32"), np.array([ 0.04282563, -0.0462016 ,  0.01536529,  0.04563082, -0.01416836,
        0.01212273], dtype="float32")]

model.set_weights(weights)
model.fit(np.array([[1,1,1,1,1,1,1]]), np.array([[1,1,1,1,1,1]]), epochs=1, batch_size=1)
np.set_printoptions(suppress=True)
diff = np.array(model.get_weights()) - np.array(weights);
print(diff)
print(len(weights))
print(diff.shape)

#print(model.get_updates_for(np.array([[1,1,1,1,1,1,1]])))
